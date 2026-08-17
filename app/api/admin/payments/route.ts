import { parseListQuery } from '@/lib/admin/query'
import { dbError, jsonError, jsonOk, requireAdmin } from '@/lib/api/http'

const SELECT = '*, profiles:user_id(id, display_name, avatar_url), listings(id, title)'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { page, pageSize, q, from, to, searchParams } = parseListQuery(new URL(request.url))
  const status = searchParams.get('status')
  const provider = searchParams.get('provider')
  const purpose = searchParams.get('purpose')

  let query = auth.supabase.from('payments').select(SELECT, { count: 'exact' })
  if (status && ['pending', 'paid', 'failed', 'cancelled', 'expired'].includes(status)) query = query.eq('status', status)
  if (provider && ['paytota', 'dpo'].includes(provider)) query = query.eq('provider', provider)
  if (purpose) query = query.eq('purpose', purpose)
  if (q) query = query.or(`provider_payment_id.ilike.%${q}%,provider_reference.ilike.%${q}%,id.ilike.%${q}%`)

  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) return dbError(error, 'Unable to load payments.')
  return jsonOk({ data: data ?? [], total: count ?? 0, page, pageSize })
}

export async function POST() {
  return jsonError('Method not allowed.', 405)
}
