import { writeAudit } from '@/lib/admin/audit'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'

type Params = { params: Promise<{ id: string }> }

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('articles').select('*').eq('id', id).maybeSingle()
  if (error) return dbError(error, 'Unable to load article.')
  if (!data) return jsonError('Article not found.', 404)
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
  if (typeof body.slug === 'string') updates.slug = slugify(body.slug)
  if (typeof body.excerpt === 'string') updates.excerpt = body.excerpt.trim()
  if (typeof body.body === 'string') updates.body = body.body
  if (typeof body.type === 'string') updates.type = body.type
  if (typeof body.cover_color === 'string') updates.cover_color = body.cover_color
  if (typeof body.accent_color === 'string') updates.accent_color = body.accent_color
  if (typeof body.status === 'string') {
    if (!['draft', 'published', 'archived'].includes(body.status)) return jsonError('Invalid status.')
    updates.status = body.status
    updates.published_at = body.status === 'published' ? new Date().toISOString() : null
  }
  if (!Object.keys(updates).length) return jsonError('No updates provided.')

  const { data, error } = await auth.supabase.from('articles').update(updates).eq('id', id).select().single()
  if (error) return dbError(error, 'Unable to update article.', 400)
  await writeAudit(auth.supabase, { actorId: auth.user.id, action: 'article.update', entityType: 'article', entityId: id, metadata: updates })
  return jsonOk({ data })
}
