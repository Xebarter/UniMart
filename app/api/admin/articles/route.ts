import { writeAudit } from '@/lib/admin/audit'
import { ilikeOr, parseListQuery } from '@/lib/admin/query'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'
import { sanitizeArticleHtml } from '@/lib/article'

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { page, pageSize, q, from, to, searchParams } = parseListQuery(new URL(request.url))
  const status = searchParams.get('status')

  let query = auth.supabase.from('articles').select('*', { count: 'exact' })
  if (status && ['draft', 'published', 'archived'].includes(status)) query = query.eq('status', status)
  if (q) query = query.or(ilikeOr(['title', 'slug', 'excerpt', 'type'], q))

  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) return dbError(error, 'Unable to load articles.')
  return jsonOk({ data: data ?? [], total: count ?? 0, page, pageSize })
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const slug = typeof body.slug === 'string' && body.slug.trim() ? slugify(body.slug) : slugify(title)
  if (!title || !slug) return jsonError('Title and slug are required.')
  const row = {
    author_id: auth.user.id,
    title,
    slug,
    excerpt: String(body.excerpt ?? '').trim(),
    body: sanitizeArticleHtml(String(body.body ?? '')),
    type: typeof body.type === 'string' ? body.type : 'Community',
    cover_url: typeof body.cover_url === 'string' ? body.cover_url.trim() || null : null,
    cover_color: typeof body.cover_color === 'string' ? body.cover_color : '#e4dbee',
    accent_color: typeof body.accent_color === 'string' ? body.accent_color : '#745a8e',
    status: typeof body.status === 'string' && ['draft', 'published', 'archived'].includes(body.status) ? body.status : 'draft',
    published_at: body.status === 'published' ? new Date().toISOString() : null,
  }
  let { data, error } = await auth.supabase.from('articles').insert(row).select().single()
  if (error && /cover_url/i.test(error.message ?? '')) {
    const { cover_url: _cover, ...legacy } = row
    const retry = await auth.supabase.from('articles').insert(legacy).select().single()
    data = retry.data
    error = retry.error
  }
  if (error) return dbError(error, 'Unable to create article.', 400)
  await writeAudit(auth.supabase, { actorId: auth.user.id, action: 'article.create', entityType: 'article', entityId: data.id })
  return jsonOk({ data }, 201)
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson<{ id?: string; status?: string }>(request)
  if (!body?.id || !body.status) return jsonError('id and status are required.')
  if (!['draft', 'published', 'archived'].includes(body.status)) return jsonError('Invalid status.')
  const { data, error } = await auth.supabase
    .from('articles')
    .update({ status: body.status, published_at: body.status === 'published' ? new Date().toISOString() : null })
    .eq('id', body.id)
    .select()
    .single()
  if (error) return dbError(error, 'Unable to update article.', 400)
  await writeAudit(auth.supabase, { actorId: auth.user.id, action: 'article.status', entityType: 'article', entityId: body.id, metadata: { status: body.status } })
  return jsonOk({ data })
}
