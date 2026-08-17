'use client'

import { getFirebaseAuth } from '@/lib/firebase'
import { createClient } from '@/lib/supabase/client'

async function restoreFromGoogle() {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return false
  const auth = getFirebaseAuth()
  await auth.authStateReady()
  const user = auth.currentUser
  if (!user) return false
  const idToken = await user.getIdToken()
  const response = await fetch('/api/auth/firebase', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  return response.ok
}

/** Refresh cookies once, and recover a Google session if the tab still has one. */
export async function ensureBrowserSession() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return user
  const restored = await restoreFromGoogle().catch(() => false)
  if (!restored) return null
  const { data: { user: again } } = await supabase.auth.getUser()
  return again
}

export async function signOutUniMart() {
  const supabase = createClient()
  await supabase.auth.signOut({ scope: 'local' })
  try {
    const { signOut } = await import('firebase/auth')
    await signOut(getFirebaseAuth())
  } catch {
    // Email accounts never initialize Firebase.
  }
  window.location.assign('/')
}
