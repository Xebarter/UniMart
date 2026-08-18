'use client'

import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth'
import { completeGoogleSignIn } from '@/lib/google-auth-client'
import { getFirebaseAuth } from '@/lib/firebase'
import { isValidE164 } from '@/lib/phone'

export const PHONE_SEND_BUTTON_ID = 'unimart-sign-in-button'
export const PHONE_RECAPTCHA_ID = 'unimart-phone-recaptcha'

let confirmation: ConfirmationResult | null = null
let verifier: RecaptchaVerifier | null = null
let widgetId: number | null = null
let host: HTMLElement | null = null

function authErrorCode(error: unknown) {
  if (typeof error === 'object' && error && 'code' in error) return String((error as { code: string }).code)
  return ''
}

function authErrorText(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return ''
}

export function phoneAuthMessage(error: unknown) {
  const code = authErrorCode(error)
  const text = authErrorText(error)
  if (code === 'auth/invalid-phone-number' || code === 'auth/missing-phone-number') {
    return 'Enter a valid phone number, including country code.'
  }
  if (code === 'auth/too-many-requests' || code === 'auth/quota-exceeded') {
    return 'Too many attempts. Wait a few minutes and try again.'
  }
  if (code === 'auth/code-expired') return 'That code expired. Request a new one.'
  if (code === 'auth/invalid-verification-code') return 'That code is incorrect. Try again.'
  if (code === 'auth/session-expired') return 'This sign-in timed out. Request a new code.'
  if (code === 'auth/captcha-check-failed' || code === 'auth/invalid-app-credential' || code === 'auth/missing-app-credential') {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'Firebase blocks live SMS from localhost. Open http://127.0.0.1:3000 and add 127.0.0.1 under Authentication → Settings → Authorized domains, or use a test phone number in Firebase.'
    }
    return 'Unable to verify this request. Refresh the page and try again.'
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Phone sign-in is not enabled for this project yet.'
  }
  if (/SMS_NOT_ALLOWED|region/i.test(`${code} ${text}`)) {
    return 'We can’t send SMS to this country yet. Enable Uganda in the Firebase SMS region policy.'
  }
  if (text) return text
  return 'Unable to continue with phone. Please try again.'
}

function grecaptchaApi() {
  return (window as unknown as { grecaptcha?: { reset: (id?: number) => void } }).grecaptcha
}

function resetVerifier() {
  if (widgetId == null) return
  try {
    grecaptchaApi()?.reset(widgetId)
  } catch {
    // Widget may already be gone.
  }
}

function clearVerifier() {
  try {
    verifier?.clear()
  } catch {
    // Recaptcha may already be gone with the node.
  }
  verifier = null
  widgetId = null
  host = null
}

export function clearPhoneAuth() {
  confirmation = null
  clearVerifier()
}

export async function ensurePhoneVerifier() {
  const el = document.getElementById(PHONE_RECAPTCHA_ID)
  if (!el) throw new Error('Phone verification is still loading. Try again.')
  if (verifier && host === el) return verifier

  clearVerifier()
  const auth = getFirebaseAuth()
  auth.useDeviceLanguage()
  verifier = new RecaptchaVerifier(auth, el, {
    size: 'invisible',
    callback: () => undefined,
    'expired-callback': () => resetVerifier(),
  })
  host = el
  widgetId = await verifier.render()
  return verifier
}

export async function sendPhoneCode(e164: string) {
  if (!isValidE164(e164)) throw new Error('Enter a valid phone number, including country code.')
  const appVerifier = await ensurePhoneVerifier()
  const auth = getFirebaseAuth()
  try {
    confirmation = await signInWithPhoneNumber(auth, e164, appVerifier)
    resetVerifier()
  } catch (error) {
    confirmation = null
    resetVerifier()
    throw error
  }
}

export async function confirmPhoneCode(code: string) {
  const trimmed = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(trimmed)) throw new Error('Enter the 6-digit code from your SMS.')
  if (!confirmation) throw new Error('Request a new code first.')
  const credential = await confirmation.confirm(trimmed)
  await completeGoogleSignIn(credential.user)
  confirmation = null
  return credential.user
}

export function hasPendingPhoneCode() {
  return Boolean(confirmation)
}
