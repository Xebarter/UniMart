'use client'

import { useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type UserCredential,
} from 'firebase/auth'
import { getSafeNextPath } from '@/lib/auth'
import { getFirebaseAuth } from '@/lib/firebase'

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function isCancelled(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  return code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request'
}

function shouldRedirect(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  return code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment'
}

async function createSupabaseSession(credential: UserCredential) {
  const idToken = await credential.user.getIdToken()
  const response = await fetch('/api/auth/firebase', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  const payload = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new Error(payload.error || 'Unable to complete Google sign-in.')
}

function nextPath() {
  const stored = sessionStorage.getItem('unimart_auth_next')
  if (stored) sessionStorage.removeItem('unimart_auth_next')
  return getSafeNextPath(stored || new URLSearchParams(window.location.search).get('next'))
}

export function GoogleAuthButton({
  label,
  onError,
  onSuccess,
  checkRedirect = true,
  className = 'mt-6',
}: {
  label: string
  onError: (message: string) => void
  onSuccess?: () => void | Promise<void>
  checkRedirect?: boolean
  className?: string
}) {
  const [loading, setLoading] = useState(checkRedirect)

  useEffect(() => {
    if (!checkRedirect) return
    let cancelled = false
    ;(async () => {
      try {
        const result = await getRedirectResult(getFirebaseAuth())
        if (cancelled) return
        if (result) {
          await createSupabaseSession(result)
          if (onSuccess) {
            await onSuccess()
            return
          }
          window.location.href = nextPath()
          return
        }
      } catch {
        if (!cancelled) onError('Google sign-in is unavailable right now. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [checkRedirect, onError, onSuccess])

  async function continueWithGoogle() {
    setLoading(true)
    const next = getSafeNextPath(new URLSearchParams(window.location.search).get('next'))
    sessionStorage.setItem('unimart_auth_next', next)
    const auth = getFirebaseAuth()
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    provider.addScope('email')
    provider.addScope('profile')
    try {
      const result = await signInWithPopup(auth, provider)
      await createSupabaseSession(result)
      if (onSuccess) {
        await onSuccess()
        setLoading(false)
        return
      }
      window.location.href = next
    } catch (error) {
      if (isCancelled(error)) {
        setLoading(false)
        return
      }
      if (shouldRedirect(error)) {
        await signInWithRedirect(auth, provider)
        return
      }
      setLoading(false)
      onError('Google sign-in is unavailable right now. Please try again.')
    }
  }

  return (
    <button
      type="button"
      onClick={continueWithGoogle}
      disabled={loading}
      className={`inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-white text-sm font-bold text-foreground transition hover:bg-muted disabled:opacity-60 ${className}`}
    >
      <GoogleMark />
      {loading ? 'Connecting…' : label}
    </button>
  )
}

export function AuthDivider() {
  return (
    <div className="mt-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
