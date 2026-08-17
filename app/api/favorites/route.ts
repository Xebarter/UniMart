import { dbError, jsonError, jsonOk, parseJson, requireUser } from '@/lib/api/http'

async function userOr401() {
  return requireUser()
}

export async function GET() {
  const auth = await userOr401()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('favorites').select('listing_id, listings(*, listing_media(*), profiles:owner_id(id, display_name, avatar_url, verified))').eq('user_id', auth.user.id).order('created_at', { ascending: false })
  if (error) return dbError(error, 'Unable to load favorites.')
  return jsonOk({ data: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await userOr401()
  if (auth.response) return auth.response
  const body = await parseJson<{ listing_id?: string }>(request)
  if (!body?.listing_id) return jsonError('listing_id is required.')
  const { error } = await auth.supabase.from('favorites').upsert({ user_id: auth.user.id, listing_id: body.listing_id })
  if (error) return dbError(error, 'Unable to save listing.', 400)
  return jsonOk({ saved: true })
}

export async function DELETE(request: Request) {
  const auth = await userOr401()
  if (auth.response) return auth.response
  const body = await parseJson<{ listing_id?: string }>(request)
  if (!body?.listing_id) return jsonError('listing_id is required.')
  const { error } = await auth.supabase.from('favorites').delete().eq('user_id', auth.user.id).eq('listing_id', body.listing_id)
  if (error) return dbError(error, 'Unable to remove saved listing.', 400)
  return jsonOk({ saved: false })
}
