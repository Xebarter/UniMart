'use client'

import { useEffect } from 'react'
import {
  clearGoogleRedirectPending,
  completeGoogleSignIn,
  consumeGoogleAuthNext,
  googleRedirectPending,
  notifyGoogleAuthDone,
  readGoogleRedirectResult,
  storeGoogleAuthError,
} from '@/lib/google-auth-client'
import { getFirebaseAuth } from '@/lib/firebase'

export function GoogleAuthRedirectHandler() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return
    let active = true

    ;(async () => {
      const pending = googleRedirectPending()
      try {
        const result = await readGoogleRedirectResult()
        const auth = getFirebaseAuth()
        await auth.authStateReady()
        const user = result?.user ?? (pending ? auth.currentUser : null)
        if (!active) return
        if (!user) {
          if (pending) {
            clearGoogleRedirectPending()
            notifyGoogleAuthDone()
          }
          return
        }

        await completeGoogleSignIn(user)
        if (!active) return

        const next = consumeGoogleAuthNext()
        notifyGoogleAuthDone()
        if (next && next !== window.location.pathname) {
          window.location.replace(next)
          return
        }
        window.location.reload()
      } catch (error) {
        if (!active) return
        clearGoogleRedirectPending()
        const message = error instanceof Error ? error.message : 'Unable to complete Google sign-in.'
        console.error('[unimart:google-auth]', message)
        storeGoogleAuthError(message)
        notifyGoogleAuthDone()
        if (!window.location.pathname.startsWith('/auth/')) {
          window.location.replace('/auth/login')
          return
        }
        window.location.reload()
      }
    })()

    return () => {
      active = false
    }
  }, [])

  return null
}
