import { createClient } from '@/lib/supabase/server'
import { dbError, jsonError, jsonOk } from '@/lib/api/http'

const LISTING_SELECT = '*, listing_media(*), profiles:owner_id(id, display_name, university, campus, avatar_url, verified)'
const SHOP_SELECT = '*, profiles:owner_id(id, display_name, university, campus, avatar_url, verified)'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: shop, error } = await supabase.from('shops').select(SHOP_SELECT).eq('slug', slug).maybeSingle()
  if (error) return dbError(error, 'Unable to load shop.')
  if (!shop) return jsonError('Shop not found.', 404)

  const [{ data: listings }, { count: followerCount }] = await Promise.all([
    supabase.from('listings').select(LISTING_SELECT).eq('shop_id', shop.id).eq('status', 'active').order('featured_until', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', shop.owner_id),
  ])

  const { data: { user } } = await supabase.auth.getUser()
  let following = false
  if (user && user.id !== shop.owner_id) {
    const { data: row } = await supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', shop.owner_id).maybeSingle()
    following = Boolean(row)
  }

  return jsonOk({
    data: shop,
    listings: listings ?? [],
    follower_count: followerCount ?? 0,
    following,
  })
}
