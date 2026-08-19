import { authPhotoUrl, dbError, jsonError, jsonOk, parseJson, requireUser } from '@/lib/api/http'
import { authContactPhone, hasContactPhone, isValidE164 } from '@/lib/phone'
import {
  isStudentNumberTakenError,
  normalizeStudentNumber,
  STUDENT_NUMBER_TAKEN,
  validateStudentNumber,
} from '@/lib/student-number'

export async function GET() {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle()
  if (error) return dbError(error, 'Unable to load profile.')
  let profile = data
  const fallback = authPhotoUrl(auth.user)
  if (profile && !profile.avatar_url && fallback) {
    const { data: updated } = await auth.supabase
      .from('profiles')
      .update({ avatar_url: fallback })
      .eq('id', auth.user.id)
      .select()
      .maybeSingle()
    profile = updated ?? { ...profile, avatar_url: fallback }
  }
  const authPhone = authContactPhone(auth.user)
  if (profile && !hasContactPhone(profile.phone_primary) && isValidE164(authPhone)) {
    const { data: updated } = await auth.supabase
      .from('profiles')
      .update({ phone_primary: authPhone, updated_at: new Date().toISOString() })
      .eq('id', auth.user.id)
      .select()
      .maybeSingle()
    profile = updated ?? { ...profile, phone_primary: authPhone }
  }
  return jsonOk({ data: profile, user: accountUser(auth.user) })
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
  if (typeof body.student_number === 'string') {
    const studentNumber = normalizeStudentNumber(body.student_number)
    if (!studentNumber) {
      updates.student_number = null
    } else {
      const invalid = validateStudentNumber(studentNumber)
      if (invalid) return jsonError(invalid)
      updates.student_number = studentNumber
    }
  }
  if (typeof body.phone_primary === 'string') {
    const phone = body.phone_primary.trim()
    if (!phone) return jsonError('A phone number is required.')
    if (!isValidE164(phone)) return jsonError('Enter a valid phone number.')
    updates.phone_primary = phone
  }
  if (body.phone_secondary === null) {
    updates.phone_secondary = null
  } else if (typeof body.phone_secondary === 'string') {
    const phone = body.phone_secondary.trim()
    if (!phone) {
      updates.phone_secondary = null
    } else if (!isValidE164(phone)) {
      return jsonError('Enter a valid second phone number.')
    } else if (phone === updates.phone_primary) {
      return jsonError('Use two different numbers.')
    } else {
      updates.phone_secondary = phone
    }
  }
  const { data, error } = await auth.supabase.from('profiles').upsert(updates).select().single()
  if (isStudentNumberTakenError(error)) return jsonError(STUDENT_NUMBER_TAKEN, 409)
  if (error) return dbError(error, 'Unable to update profile.')
  return jsonOk({ data })
}
