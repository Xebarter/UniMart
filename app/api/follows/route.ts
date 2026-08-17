import { dbError, jsonError, jsonOk, parseJson, requireUser } from '@/lib/api/http'

export async function GET() {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase
    .from('follows')
    .select('following_id, profiles:following_id(id, display_name, university, campus, avatar_url, verified)')
    .eq('follower_id', auth.user.id)
  if (error) return dbError(error, 'Unable to load follows.')
  return jsonOk({ data: (data ?? []).map((row) => row.profiles).filter(Boolean) })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson<{ following_id?: string }>(request)
  if (!body?.following_id || body.following_id === auth.user.id) return jsonError('A valid user is required.')
  const { error } = await auth.supabase.from('follows').upsert({ follower_id: auth.user.id, following_id: body.following_id })
  if (error) return dbError(error, 'Unable to follow user.', 400)
  return jsonOk({ following: true })
}

export async function DELETE(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson<{ following_id?: string }>(request)
  if (!body?.following_id) return jsonError('following_id is required.')
  const { error } = await auth.supabase.from('follows').delete().eq('follower_id', auth.user.id).eq('following_id', body.following_id)
  if (error) return dbError(error, 'Unable to unfollow user.', 400)
  return jsonOk({ following: false })
}
