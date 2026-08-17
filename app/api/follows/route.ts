import { dbError, jsonError, jsonOk, parseJson, requireUser } from '@/lib/api/http'
import type { FollowedProfile } from '@/lib/types'

type FollowRow = {
  following_id: string
  profiles: (FollowedProfile & { shops?: { name: string; slug: string } | { name: string; slug: string }[] | null }) | null
}

export async function GET() {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase
    .from('follows')
    .select('following_id, profiles:following_id(id, display_name, university, campus, avatar_url, verified, bio, role, created_at, updated_at, shops(name, slug))')
    .eq('follower_id', auth.user.id)
  if (error) return dbError(error, 'Unable to load follows.')
  const people = ((data ?? []) as unknown as FollowRow[]).map((row) => {
    const profile = row.profiles
    if (!profile) return null
    const raw = profile.shops
    const shop = Array.isArray(raw) ? raw[0] : raw
    const { shops: _shops, ...rest } = profile
    return { ...rest, shop: shop ? { name: shop.name, slug: shop.slug } : null }
  }).filter((item): item is FollowedProfile => Boolean(item))
  return jsonOk({ data: people })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson<{ following_id?: string }>(request)
  if (!body?.following_id || body.following_id === auth.user.id) return jsonError('A valid user is required.')
  const { data: shop } = await auth.supabase.from('shops').select('id').eq('owner_id', body.following_id).maybeSingle()
  if (!shop) return jsonError('You can only follow shops.', 400)
  const { error } = await auth.supabase.from('follows').upsert({ follower_id: auth.user.id, following_id: body.following_id })
  if (error) return dbError(error, 'Unable to follow shop.', 400)
  return jsonOk({ following: true })
}

export async function DELETE(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson<{ following_id?: string }>(request)
  if (!body?.following_id) return jsonError('following_id is required.')
  const { error } = await auth.supabase.from('follows').delete().eq('follower_id', auth.user.id).eq('following_id', body.following_id)
  if (error) return dbError(error, 'Unable to unfollow.', 400)
  return jsonOk({ following: false })
}
