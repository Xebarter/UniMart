import { parseListQuery } from '@/lib/admin/query'
import { dbError, jsonError, jsonOk, requireAdmin } from '@/lib/api/http'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { page, pageSize, q, from, to, searchParams } = parseListQuery(new URL(request.url))
  const entityType = searchParams.get('entity_type')
  const action = searchParams.get('action')

  let query = auth.supabase.from('audit_logs').select('*, actor:actor_id(id, display_name, avatar_url, role)', { count: 'exact' })
  if (entityType) query = query.eq('entity_type', entityType)
  if (action) query = query.eq('action', action)
  if (q) query = query.or(`action.ilike.%${q}%,entity_type.ilike.%${q}%,entity_id.ilike.%${q}%`)

  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) {
    if (/audit_logs/i.test(error.message ?? '')) return jsonOk({ data: [], total: 0, page, pageSize })
    return dbError(error, 'Unable to load activity.')
  }
  return jsonOk({ data: data ?? [], total: count ?? 0, page, pageSize })
}

export async function POST() {
  return jsonError('Method not allowed.', 405)
}
