import { writeAudit } from '@/lib/admin/audit'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'

type Params = { params: Promise<{ id: string }> }

const SELECT = '*, listings(id, title), reporter:reporter_id(id, display_name, avatar_url), reported_user:reported_user_id(id, display_name, avatar_url)'

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('reports').select(SELECT).eq('id', id).maybeSingle()
  if (error) return dbError(error, 'Unable to load report.')
  if (!data) return jsonError('Report not found.', 404)

  let relatedQuery = auth.supabase.from('reports').select(SELECT).neq('id', id).order('created_at', { ascending: false }).limit(8)
  if (data.listing_id) relatedQuery = relatedQuery.eq('listing_id', data.listing_id)
  else if (data.reported_user_id) relatedQuery = relatedQuery.eq('reported_user_id', data.reported_user_id)
  const { data: related } = await relatedQuery

  return jsonOk({ data, related: related ?? [] })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson<{ status?: string }>(request)
  if (!body?.status || !['open', 'reviewing', 'resolved', 'dismissed'].includes(body.status)) {
    return jsonError('A valid status is required.')
  }
  const { data, error } = await auth.supabase
    .from('reports')
    .update({
      status: body.status,
      resolved_at: body.status === 'resolved' || body.status === 'dismissed' ? new Date().toISOString() : null,
      resolved_by: auth.user.id,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) return dbError(error, 'Unable to update report.', 400)
  await writeAudit(auth.supabase, { actorId: auth.user.id, action: 'report.status', entityType: 'report', entityId: id, metadata: { status: body.status } })
  return jsonOk({ data })
}
