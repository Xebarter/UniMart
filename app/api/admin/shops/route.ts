import { writeAudit } from '@/lib/admin/audit'
import { ilikeOr, parseListQuery } from '@/lib/admin/query'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'

const SELECT = '*, profiles:owner_id(id, display_name, university, campus, avatar_url, verified)'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { page, pageSize, q, from, to, searchParams } = parseListQuery(new URL(request.url))
  const status = searchParams.get('status')

  let query = auth.supabase.from('shops').select(SELECT, { count: 'exact' })
  if (status && ['active', 'disabled'].includes(status)) query = query.eq('status', status)
  if (q) query = query.or(ilikeOr(['name', 'slug', 'bio'], q))

  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error && /status/i.test(error.message ?? '')) {
    const fallback = await auth.supabase.from('shops').select(SELECT, { count: 'exact' }).order('created_at', { ascending: false }).range(from, to)
    if (fallback.error) return dbError(fallback.error, 'Unable to load shops.')
    return jsonOk({ data: fallback.data ?? [], total: fallback.count ?? 0, page, pageSize })
  }
  if (error) return dbError(error, 'Unable to load shops.')
  return jsonOk({ data: data ?? [], total: count ?? 0, page, pageSize })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson<{ id?: string; status?: string }>(request)
  if (!body?.id || !body.status) return jsonError('id and status are required.')
  if (!['active', 'disabled'].includes(body.status)) return jsonError('Invalid status.')

  const { data, error } = await auth.supabase.from('shops').update({ status: body.status }).eq('id', body.id).select().single()
  if (error) return dbError(error, 'Unable to update shop.', 400)

  if (body.status === 'disabled') {
    await auth.supabase.from('listings').update({ status: 'archived' }).eq('shop_id', body.id).eq('status', 'active')
  }
  await writeAudit(auth.supabase, { actorId: auth.user.id, action: 'shop.status', entityType: 'shop', entityId: body.id, metadata: { status: body.status } })
  return jsonOk({ data })
}
