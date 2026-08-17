import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { jsonError, jsonOk, parseJson } from '@/lib/api/http'

export const runtime = 'nodejs'

type FirebaseLookup = {
  users?: {
    localId: string
    email?: string
    displayName?: string
    photoUrl?: string
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

export async function POST(request: Request) {
  const body = await parseJson<{ idToken?: string }>(request)
  const idToken = body?.idToken
  if (!idToken) return jsonError('idToken is required.')

  try {
    const firebaseUser = await verifyFirebaseIdToken(idToken)
    const email = firebaseUser.email?.trim().toLowerCase()
    if (!email) return jsonError('This Google account does not have an email address.')

    const admin = createAdminClient()
    const displayName = firebaseUser.displayName || email.split('@')[0]
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        avatar_url: firebaseUser.photoUrl ?? null,
        firebase_uid: firebaseUser.localId,
      },
    })
    if (createError && !/already been registered|already exists/i.test(createError.message)) {
      return jsonError('Unable to create your UniMart account.', 400)
    }

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })
    const tokenHash = link?.properties?.hashed_token
    if (linkError || !tokenHash) return jsonError('Unable to start your UniMart session.', 400)

    const supabase = await createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: 'email',
      token_hash: tokenHash,
    })
    if (verifyError) return jsonError('Unable to complete Google sign-in.', 400)

    return jsonOk({ ok: true })
  } catch (err) {
    console.error('[unimart:google-auth]', err instanceof Error ? err.message : err)
    return jsonError('Google sign-in is unavailable right now. Please try again.', 401)
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}
