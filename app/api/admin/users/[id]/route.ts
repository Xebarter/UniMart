import { createAdminClient } from '@/lib/supabase/admin'
import { dbError, jsonError, jsonOk, requireAdmin } from '@/lib/api/http'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const [{ data, error }, shop, listings, reportsAgainst, reportsFiled, payments, memberships] = await Promise.all([
    auth.supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    auth.supabase.from('shops').select('*').eq('owner_id', id).maybeSingle(),
    auth.supabase.from('listings').select('*, listing_media(*)').eq('owner_id', id).order('created_at', { ascending: false }).limit(50),
    auth.supabase.from('reports').select('*, listings(id, title)').eq('reported_user_id', id).order('created_at', { ascending: false }).limit(20),
    auth.supabase.from('reports').select('*, listings(id, title)').eq('reporter_id', id).order('created_at', { ascending: false }).limit(20),
    auth.supabase.from('payments').select('*, listings(id, title)').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
    auth.supabase.from('conversation_members').select('conversation_id', { count: 'exact', head: true }).eq('user_id', id),
  ])

  if (error) return dbError(error, 'Unable to load user.')
  if (!data) return jsonError('User not found.', 404)

  let email: string | null = null
  try {
    const admin = createAdminClient()
    const { data: authUser } = await admin.auth.admin.getUserById(id)
    email = authUser.user?.email ?? null
  } catch {
    email = null
  }

  return jsonOk({
    data: { ...data, email },
    shop: shop.data ?? null,
    listings: listings.data ?? [],
    reports: [...(reportsAgainst.data ?? []), ...(reportsFiled.data ?? [])],
    payments: payments.data ?? [],
    conversation_count: memberships.count ?? 0,
  })
}
