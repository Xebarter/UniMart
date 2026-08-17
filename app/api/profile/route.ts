import { authPhotoUrl, dbError, jsonError, jsonOk, parseJson, requireUser } from '@/lib/api/http'

export async function GET() {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle()
  if (error) return dbError(error, 'Unable to load profile.')
  const fallback = authPhotoUrl(auth.user)
  if (data && !data.avatar_url && fallback) {
    const { data: updated } = await auth.supabase
      .from('profiles')
      .update({ avatar_url: fallback })
      .eq('id', auth.user.id)
      .select()
      .maybeSingle()
    return jsonOk({ data: updated ?? { ...data, avatar_url: fallback }, user: accountUser(auth.user) })
  }
  return jsonOk({ data, user: accountUser(auth.user) })
}

function accountUser(user: { id: string; email?: string; identities?: { provider?: string }[] | null; app_metadata?: { provider?: string } }) {
  const providers = [
    ...new Set(
      (user.identities ?? [])
        .map((identity) => identity.provider)
        .concat(user.app_metadata?.provider)
        .filter((value): value is string => Boolean(value)),
    ),
  ]
  return { id: user.id, email: user.email, providers }
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  const displayName = typeof body.display_name === 'string' ? body.display_name.trim() : ''
  if (!displayName) return jsonError('Display name is required.')
  const updates: Record<string, unknown> = {
    id: auth.user.id,
    display_name: displayName.slice(0, 80),
    university: typeof body.university === 'string' ? body.university.trim() || null : null,
    campus: typeof body.campus === 'string' ? body.campus.trim() || null : null,
    bio: typeof body.bio === 'string' ? body.bio.trim().slice(0, 500) || null : null,
    updated_at: new Date().toISOString(),
  }
  if (typeof body.avatar_url === 'string') updates.avatar_url = body.avatar_url.trim() || null
  const { data, error } = await auth.supabase.from('profiles').upsert(updates).select().single()
  if (error) return dbError(error, 'Unable to update profile.')
  return jsonOk({ data })
}
