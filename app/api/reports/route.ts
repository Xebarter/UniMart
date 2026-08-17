import { dbError, jsonError, jsonOk, parseJson, requireAdmin, requireUser } from '@/lib/api/http'

export async function GET() {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { data: admin } = await auth.supabase.rpc('is_admin')
  let builder = auth.supabase.from('reports').select('*, listings(id, title)').order('created_at', { ascending: false })
  if (!admin) builder = builder.eq('reporter_id', auth.user.id)
  const { data, error } = await builder
  if (error) return dbError(error, 'Unable to load reports.')
  return jsonOk({ data: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  if (!body.listing_id && !body.reported_user_id) return jsonError('A listing or user is required.')
  const reason = String(body.reason ?? '').trim()
  if (!reason) return jsonError('A reason is required.')
  const { data, error } = await auth.supabase
    .from('reports')
    .insert({
      reporter_id: auth.user.id,
      listing_id: body.listing_id ?? null,
      reported_user_id: body.reported_user_id ?? null,
      reason: reason.slice(0, 200),
      details: String(body.details ?? '').trim().slice(0, 2000),
    })
    .select()
    .single()
  if (error) return dbError(error, 'Unable to submit report.', 400)
  return jsonOk({ data }, 201)
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
  return jsonOk({ data })
}
