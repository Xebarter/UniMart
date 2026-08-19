import { dbError, jsonError, jsonOk, requireAdmin } from '@/lib/api/http'

type Params = { params: Promise<{ id: string }> }

const SELECT = '*, profiles:owner_id(id, display_name, university, campus, avatar_url, verified, phone_primary, phone_secondary)'

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const { data, error } = await auth.supabase.from('shops').select(SELECT).eq('id', id).maybeSingle()
  if (error) return dbError(error, 'Unable to load shop.')
  if (!data) return jsonError('Shop not found.', 404)

  const [{ data: listings }, followers] = await Promise.all([
    auth.supabase.from('listings').select('*, listing_media(*)').eq('shop_id', id).order('created_at', { ascending: false }),
    auth.supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', data.owner_id),
  ])

  return jsonOk({
    data: { ...data, listing_count: listings?.length ?? 0, follower_count: followers.count ?? 0 },
    listings: listings ?? [],
  })
}
