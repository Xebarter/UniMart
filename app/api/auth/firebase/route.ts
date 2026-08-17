import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isUploadedAvatar, jsonError, jsonOk, parseJson } from '@/lib/api/http'

export const runtime = 'nodejs'

type FirebaseLookup = {
  users?: {
    localId: string
    email?: string
    displayName?: string
    photoUrl?: string
    photoURL?: string
    emailVerified?: boolean
  }[]
  error?: { message?: string }
}

async function verifyFirebaseIdToken(idToken: string) {
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!key) throw new Error('Missing Firebase API key.')
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  const payload = (await response.json()) as FirebaseLookup
  const user = payload.users?.[0]
  if (!response.ok || !user) {
    throw new Error(payload.error?.message || 'Invalid Firebase session.')
  }
  return user
}

async function syncGoogleProfile(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  displayName: string,
  photoUrl: string | null,
  firebaseUid: string,
  metadata: Record<string, unknown>,
) {
  if (photoUrl) {
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...metadata,
        display_name: metadata.display_name || displayName,
        avatar_url: metadata.avatar_url || photoUrl,
        picture: metadata.picture || photoUrl,
        firebase_uid: firebaseUid,
      },
    })
  }

  const { data: profile } = await admin.from('profiles').select('avatar_url').eq('id', userId).maybeSingle()
  if (!profile) {
    await admin.from('profiles').insert({
      id: userId,
      display_name: String(metadata.display_name || displayName),
      avatar_url: photoUrl,
    })
    return
  }

  if (photoUrl && !isUploadedAvatar(profile.avatar_url)) {
    await admin.from('profiles').update({ avatar_url: photoUrl }).eq('id', userId)
  }
}

export async function POST(request: Request) {
  const body = await parseJson<{ idToken?: string }>(request)
  const idToken = body?.idToken
  if (!idToken) return jsonError('idToken is required.')

  let firebaseUser
  try {
    firebaseUser = await verifyFirebaseIdToken(idToken)
  } catch (err) {
    console.error('[unimart:google-auth] verify', err instanceof Error ? err.message : err)
    return jsonError(err instanceof Error ? err.message : 'Invalid Firebase session.', 401)
  }

  const email = firebaseUser.email?.trim().toLowerCase()
  if (!email) return jsonError('This Google account does not have an email address.')

  let admin
  try {
    admin = createAdminClient()
  } catch (err) {
    console.error('[unimart:google-auth] admin', err instanceof Error ? err.message : err)
    return jsonError('Server auth is not configured.', 503)
  }

  const displayName = firebaseUser.displayName || email.split('@')[0]
  const photoUrl = firebaseUser.photoUrl || firebaseUser.photoURL || null

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      avatar_url: photoUrl,
      picture: photoUrl,
      firebase_uid: firebaseUser.localId,
    },
  })
  if (createError && !/already been registered|already exists/i.test(createError.message)) {
    console.error('[unimart:google-auth] createUser', createError.message)
    return jsonError('Unable to create your UniMart account.', 400)
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  const tokenHash = link?.properties?.hashed_token
  if (linkError || !tokenHash) {
    console.error('[unimart:google-auth] generateLink', linkError?.message)
    return jsonError('Unable to start your UniMart session.', 400)
  }

  const supabase = await createClient()
  const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
    type: 'email',
    token_hash: tokenHash,
  })
  if (verifyError) {
    console.error('[unimart:google-auth] verifyOtp', verifyError.message)
    return jsonError('Unable to complete Google sign-in.', 400)
  }

  const userId = authData.user?.id
  if (userId) {
    await syncGoogleProfile(
      admin,
      userId,
      displayName,
      photoUrl,
      firebaseUser.localId,
      authData.user?.user_metadata ?? {},
    ).catch((err) => {
      console.error('[unimart:google-auth] profile', err instanceof Error ? err.message : err)
    })
  }

  return jsonOk({ ok: true })
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}
