import { dbError, jsonError, jsonOk, requireAdmin } from '@/lib/api/http'

type Params = { params: Promise<{ id: string }> }

const SELECT = '*, profiles:user_id(id, display_name, avatar_url), listings(id, title)'

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('payments').select(SELECT).eq('id', id).maybeSingle()
  if (error) return dbError(error, 'Unable to load payment.')
  if (!data) return jsonError('Payment not found.', 404)
  return jsonOk({ data })
}
