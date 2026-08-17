import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'

type Params = { params: Promise<{ id: string }> }

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
  return jsonOk({ data })
}
