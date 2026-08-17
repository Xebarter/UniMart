import { dbError, jsonError, jsonOk, parseJson, requireUser } from '@/lib/api/http'

export async function GET() {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle()
  if (error) return dbError(error, 'Unable to load profile.')
  return jsonOk({ data, user: { id: auth.user.id, email: auth.user.email } })
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  const displayName = typeof body.display_name === 'string' ? body.display_name.trim() : ''
  if (!displayName) return jsonError('Display name is required.')
  const updates = {
    id: auth.user.id,
    display_name: displayName.slice(0, 80),
    university: typeof body.university === 'string' ? body.university.trim() || null : null,
    campus: typeof body.campus === 'string' ? body.campus.trim() || null : null,
    bio: typeof body.bio === 'string' ? body.bio.trim().slice(0, 500) || null : null,
    avatar_url: typeof body.avatar_url === 'string' ? body.avatar_url : null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await auth.supabase.from('profiles').upsert(updates).select().single()
  if (error) return dbError(error, 'Unable to update profile.')
  return jsonOk({ data })
}
