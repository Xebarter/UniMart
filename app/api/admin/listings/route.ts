import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('listings').select('*, profiles:owner_id(id, display_name)').order('created_at', { ascending: false }).limit(200)
  if (error) return dbError(error, 'Unable to load listings.')
  return jsonOk({ data: data ?? [] })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson<{ id?: string; status?: string }>(request)
  if (!body?.id || !body.status) return jsonError('id and status are required.')
  if (!['active', 'sold', 'archived', 'removed', 'pending'].includes(body.status)) return jsonError('Invalid status.')
  const { data, error } = await auth.supabase.from('listings').update({ status: body.status }).eq('id', body.id).select().single()
  if (error) return dbError(error, 'Unable to update listing.', 400)
  return jsonOk({ data })
}
