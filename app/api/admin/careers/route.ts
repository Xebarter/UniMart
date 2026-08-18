import { writeAudit } from '@/lib/admin/audit'
import { ilikeOr, parseListQuery } from '@/lib/admin/query'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'
import { careersSchemaError, isJobStatus, jobRoleFromBody } from '@/lib/careers'
import type { JobStatus } from '@/lib/types'

function schemaOrDb(error: { message?: string; code?: string } | null, fallback: string, status = 500) {
  if (careersSchemaError(error)) {
    return jsonError('Careers tables are not initialized. Run scripts/012_careers.sql in the Supabase SQL editor.', 503)
  }
  return dbError(error, fallback, status)
}

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { page, pageSize, q, from, to, searchParams } = parseListQuery(new URL(request.url))
  const status = searchParams.get('status')
  const department = searchParams.get('department')

  let query = auth.supabase.from('job_roles').select('*', { count: 'exact' })
  if (isJobStatus(status)) query = query.eq('status', status)
  if (department && department !== 'all') query = query.eq('department', department)
  if (q) query = query.or(ilikeOr(['title', 'slug', 'department', 'location', 'excerpt'], q))

  const [{ data, error, count }, draft, published, closed, archived, applications, newApplications] = await Promise.all([
    query.order('updated_at', { ascending: false }).range(from, to),
    auth.supabase.from('job_roles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    auth.supabase.from('job_roles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    auth.supabase.from('job_roles').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
    auth.supabase.from('job_roles').select('id', { count: 'exact', head: true }).eq('status', 'archived'),
    auth.supabase.from('job_applications').select('id', { count: 'exact', head: true }),
    auth.supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ])

  if (error) return schemaOrDb(error, 'Unable to load roles.')
  return jsonOk({
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    counts: {
      draft: draft.count ?? 0,
      published: published.count ?? 0,
      closed: closed.count ?? 0,
      archived: archived.count ?? 0,
    },
    applications: {
      new: newApplications.count ?? 0,
      total: applications.count ?? 0,
    },
  })
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  const parsed = jobRoleFromBody(body)
  if (!parsed.title || !parsed.slug) return jsonError('Title and slug are required.')
  const status: JobStatus = isJobStatus(body.status) ? body.status : 'draft'
  const row = {
    ...parsed,
    created_by: auth.user.id,
    status,
    published_at: status === 'published' ? new Date().toISOString() : null,
  }
  const { data, error } = await auth.supabase.from('job_roles').insert(row).select().single()
  if (error?.code === '23505') return jsonError('That slug is already in use.')
  if (error) return schemaOrDb(error, 'Unable to create role.', 400)
  await writeAudit(auth.supabase, { actorId: auth.user.id, action: 'career.create', entityType: 'job_role', entityId: data.id })
  return jsonOk({ data }, 201)
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson<{ id?: string; status?: string }>(request)
  if (!body?.id || !body.status) return jsonError('id and status are required.')
  if (!isJobStatus(body.status)) return jsonError('Invalid status.')
  const updates: Record<string, unknown> = { status: body.status }
  if (body.status === 'published') updates.published_at = new Date().toISOString()
  const { data, error } = await auth.supabase.from('job_roles').update(updates).eq('id', body.id).select().single()
  if (error) return schemaOrDb(error, 'Unable to update role.', 400)
  await writeAudit(auth.supabase, {
    actorId: auth.user.id,
    action: 'career.status',
    entityType: 'job_role',
    entityId: body.id,
    metadata: { status: body.status },
  })
  return jsonOk({ data })
}
