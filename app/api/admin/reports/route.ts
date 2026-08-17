import { writeAudit } from '@/lib/admin/audit'
import { ilikeOr, parseListQuery } from '@/lib/admin/query'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'

const SELECT = '*, listings(id, title, category, listing_media(*)), reporter:reporter_id(id, display_name, avatar_url), reported_user:reported_user_id(id, display_name, avatar_url)'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { page, pageSize, q, from, to, searchParams } = parseListQuery(new URL(request.url))
  const status = searchParams.get('status')
  const kind = searchParams.get('kind')

  let query = auth.supabase.from('reports').select(SELECT, { count: 'exact' })
  if (status && ['open', 'reviewing', 'resolved', 'dismissed'].includes(status)) query = query.eq('status', status)
  if (kind === 'listing') query = query.not('listing_id', 'is', null)
  if (kind === 'user') query = query.not('reported_user_id', 'is', null)
  if (q) query = query.or(ilikeOr(['reason', 'details'], q))

  const [{ data, error, count }, open, reviewing, resolved, dismissed] = await Promise.all([
    query.order('created_at', { ascending: false }).range(from, to),
    auth.supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    auth.supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'reviewing'),
    auth.supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
    auth.supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'dismissed'),
  ])
  if (error) return dbError(error, 'Unable to load reports.')
  return jsonOk({
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    counts: {
      open: open.count ?? 0,
      reviewing: reviewing.count ?? 0,
      resolved: resolved.count ?? 0,
      dismissed: dismissed.count ?? 0,
    },
  })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson<{ id?: string; status?: string }>(request)
  if (!body?.id || !body.status) return jsonError('id and status are required.')
  if (!['open', 'reviewing', 'resolved', 'dismissed'].includes(body.status)) return jsonError('Invalid status.')
  const { data, error } = await auth.supabase
    .from('reports')
    .update({
      status: body.status,
      resolved_at: body.status === 'resolved' || body.status === 'dismissed' ? new Date().toISOString() : null,
      resolved_by: body.status === 'resolved' || body.status === 'dismissed' ? auth.user.id : null,
    })
    .eq('id', body.id)
    .select()
    .single()
  if (error) return dbError(error, 'Unable to update report.', 400)
  await writeAudit(auth.supabase, { actorId: auth.user.id, action: 'report.status', entityType: 'report', entityId: body.id, metadata: { status: body.status } })
  return jsonOk({ data })
}
