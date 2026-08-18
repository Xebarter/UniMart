import { writeAudit } from '@/lib/admin/audit'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'
import { sanitizeArticleHtml } from '@/lib/article'

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
  if (typeof body.body === 'string') updates.body = sanitizeArticleHtml(body.body)
  if (typeof body.type === 'string') updates.type = body.type
  if (typeof body.cover_url === 'string') updates.cover_url = body.cover_url.trim() || null
  if (body.cover_url === null) updates.cover_url = null
  if (typeof body.cover_color === 'string') updates.cover_color = body.cover_color
  if (typeof body.accent_color === 'string') updates.accent_color = body.accent_color
  if (typeof body.status === 'string') {
    if (!['draft', 'published', 'archived'].includes(body.status)) return jsonError('Invalid status.')
    updates.status = body.status
    updates.published_at = body.status === 'published' ? new Date().toISOString() : null
  }
  if (!Object.keys(updates).length) return jsonError('No updates provided.')

  let { data, error } = await auth.supabase.from('articles').update(updates).eq('id', id).select().single()
  if (error && /cover_url/i.test(error.message ?? '')) {
    const { cover_url: _cover, ...legacy } = updates
    if (!Object.keys(legacy).length) return jsonError('Run scripts/010_article-cover.sql to store article images.')
    const retry = await auth.supabase.from('articles').update(legacy).eq('id', id).select().single()
    data = retry.data
    error = retry.error
  }
  if (error) return dbError(error, 'Unable to update article.', 400)
  await writeAudit(auth.supabase, { actorId: auth.user.id, action: 'article.update', entityType: 'article', entityId: id, metadata: updates })
  return jsonOk({ data })
}
