import { dbError, jsonError, jsonOk, parseJson, requireUser } from '@/lib/api/http'

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson<{ token?: string; platform?: string }>(request)
  if (!body?.token) return jsonError('token is required.')
  const { data, error } = await auth.supabase
    .from('push_tokens')
    .upsert({ user_id: auth.user.id, token: body.token, platform: body.platform ?? 'web', updated_at: new Date().toISOString() }, { onConflict: 'token' })
    .select()
    .single()
  if (error) return dbError(error, 'Unable to save device token.', 400)
  return jsonOk({ data }, 201)
}

export async function DELETE(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson<{ token?: string }>(request)
  if (!body?.token) return jsonError('token is required.')
  const { error } = await auth.supabase.from('push_tokens').delete().eq('user_id', auth.user.id).eq('token', body.token)
  if (error) return dbError(error, 'Unable to remove device token.', 400)
  return jsonOk({ removed: true })
}
