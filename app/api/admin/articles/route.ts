import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'

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
  return jsonOk({ data })
}
