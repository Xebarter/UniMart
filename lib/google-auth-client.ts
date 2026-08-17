'use client'

import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { getSafeNextPath } from '@/lib/auth'
import { browserPopupRedirectResolver, getFirebaseAuth } from '@/lib/firebase'

const AUTH_NEXT_KEY = 'unimart_auth_next'
const REDIRECT_KEY = 'unimart_google_redirect'
const AUTH_ERROR_KEY = 'unimart_auth_error'
const DONE_EVENT = 'unimart-google-auth-done'

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function googleProvider() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  provider.addScope('email')
  provider.addScope('profile')
  return provider
}

function authErrorCode(error: unknown) {
  if (typeof error === 'object' && error && 'code' in error) return String((error as { code: string }).code)
  return ''
}

export async function completeGoogleSignIn(user: Pick<User, 'getIdToken'>) {
  const idToken = await user.getIdToken()
  const response = await fetch('/api/auth/firebase', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  const payload = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new Error(payload.error || 'Unable to complete Google sign-in.')
}

export function storeGoogleAuthNext(next?: string | null) {
  if (!canUseSessionStorage()) return
  sessionStorage.setItem(AUTH_NEXT_KEY, getSafeNextPath(next))
  sessionStorage.setItem(REDIRECT_KEY, '1')
}

export function consumeGoogleAuthNext() {
  if (!canUseSessionStorage()) return getSafeNextPath(null)
  const stored = sessionStorage.getItem(AUTH_NEXT_KEY)
  sessionStorage.removeItem(AUTH_NEXT_KEY)
  sessionStorage.removeItem(REDIRECT_KEY)
  return getSafeNextPath(stored || new URLSearchParams(window.location.search).get('next'))
}

export function googleRedirectPending() {
  if (!canUseSessionStorage()) return false
  return sessionStorage.getItem(REDIRECT_KEY) === '1'
}

export function clearGoogleRedirectPending() {
  if (!canUseSessionStorage()) return
  sessionStorage.removeItem(REDIRECT_KEY)
}

export function storeGoogleAuthError(message: string) {
  if (!canUseSessionStorage()) return
  sessionStorage.setItem(AUTH_ERROR_KEY, message)
}

export function consumeGoogleAuthError() {
  if (!canUseSessionStorage()) return ''
  const message = sessionStorage.getItem(AUTH_ERROR_KEY) ?? ''
  sessionStorage.removeItem(AUTH_ERROR_KEY)
  return message
}

export function notifyGoogleAuthDone() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(DONE_EVENT))
}

export function onGoogleAuthDone(handler: () => void) {
  window.addEventListener(DONE_EVENT, handler)
  return () => window.removeEventListener(DONE_EVENT, handler)
}

let redirectResult: Promise<UserCredential | null> | null = null

export function readGoogleRedirectResult() {
  if (!redirectResult) {
    redirectResult = getRedirectResult(getFirebaseAuth(), browserPopupRedirectResolver).catch((error) => {
      redirectResult = null
      throw error
    })
  }
  return redirectResult
}

export async function startGoogleSignIn(next?: string | null) {
  storeGoogleAuthNext(next)
  const auth = getFirebaseAuth()
  const provider = googleProvider()

  try {
    const credential = await signInWithPopup(auth, provider, browserPopupRedirectResolver)
    await completeGoogleSignIn(credential.user)
    const destination = consumeGoogleAuthNext()
    notifyGoogleAuthDone()
    return { ok: true as const, next: destination }
  } catch (error) {
    const code = authErrorCode(error)
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      clearGoogleRedirectPending()
      notifyGoogleAuthDone()
      return { ok: false as const, cancelled: true }
    }
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider, browserPopupRedirectResolver)
      return { ok: false as const, redirected: true }
    }
    clearGoogleRedirectPending()
    notifyGoogleAuthDone()
    throw error
  }
}
