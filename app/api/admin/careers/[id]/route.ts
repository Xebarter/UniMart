import { writeAudit } from '@/lib/admin/audit'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'
import { careersSchemaError, isJobStatus, jobRoleFromBody, parseClosesAt, parseOptionalUrl, slugifyJob } from '@/lib/careers'
import { sanitizeArticleHtml } from '@/lib/article'

type Params = { params: Promise<{ id: string }> }

function schemaOrDb(error: { message?: string; code?: string } | null, fallback: string, status = 500) {
  if (careersSchemaError(error)) {
    return jsonError('Careers tables are not initialized. Run scripts/012_careers.sql in the Supabase SQL editor.', 503)
  }
  return dbError(error, fallback, status)
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('job_roles').select('*').eq('id', id).maybeSingle()
  if (error) return schemaOrDb(error, 'Unable to load role.')
  if (!data) return jsonError('Role not found.', 404)
  return jsonOk({ data })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')

  const updates: Record<string, unknown> = {}
  if (typeof body.title === 'string') updates.title = body.title.trim()
  if (typeof body.slug === 'string') updates.slug = slugifyJob(body.slug)
  if (typeof body.department === 'string') updates.department = body.department.trim().slice(0, 80) || 'General'
  if (typeof body.location === 'string') updates.location = body.location.trim().slice(0, 120) || 'Kampala, Uganda'
  if (typeof body.excerpt === 'string') updates.excerpt = body.excerpt.trim().slice(0, 400)
  if (typeof body.description === 'string') updates.description = sanitizeArticleHtml(body.description)
  if (typeof body.requirements === 'string') updates.requirements = sanitizeArticleHtml(body.requirements)
  if (typeof body.benefits === 'string') updates.benefits = sanitizeArticleHtml(body.benefits)
  if (typeof body.apply_email === 'string') updates.apply_email = body.apply_email.trim().slice(0, 160) || null
  if ('apply_url' in body) updates.apply_url = parseOptionalUrl(body.apply_url)
  if (typeof body.featured === 'boolean') updates.featured = body.featured
  if (body.sort_order !== undefined) updates.sort_order = Math.max(0, Math.round(Number(body.sort_order) || 0))
  if ('closes_at' in body) updates.closes_at = parseClosesAt(body.closes_at)
  if ('employment_type' in body || 'workplace' in body || 'status' in body) {
    const parsed = jobRoleFromBody(body, typeof body.title === 'string' ? body.title : '')
    if ('employment_type' in body) updates.employment_type = parsed.employment_type
    if ('workplace' in body) updates.workplace = parsed.workplace
  }
  if (typeof body.status === 'string') {
    if (!isJobStatus(body.status)) return jsonError('Invalid status.')
    updates.status = body.status
    if (body.status === 'published') {
      const { data: current } = await auth.supabase.from('job_roles').select('published_at').eq('id', id).maybeSingle()
      if (!current?.published_at) updates.published_at = new Date().toISOString()
    }
  }
  if (!Object.keys(updates).length) return jsonError('No updates provided.')

  const { data, error } = await auth.supabase.from('job_roles').update(updates).eq('id', id).select().single()
  if (error?.code === '23505') return jsonError('That slug is already in use.')
  if (error) return schemaOrDb(error, 'Unable to update role.', 400)
  await writeAudit(auth.supabase, { actorId: auth.user.id, action: 'career.update', entityType: 'job_role', entityId: id, metadata: updates })
  return jsonOk({ data })
}
