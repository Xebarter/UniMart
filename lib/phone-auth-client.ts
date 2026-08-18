'use client'

import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth'
import { completeGoogleSignIn } from '@/lib/google-auth-client'
import { getFirebaseAuth } from '@/lib/firebase'
import { isValidE164 } from '@/lib/phone'

export const PHONE_SEND_BUTTON_ID = 'unimart-sign-in-button'

let verifier: RecaptchaVerifier | null = null
let confirmation: ConfirmationResult | null = null
let widgetId: number | null = null

function authErrorCode(error: unknown) {
  if (typeof error === 'object' && error && 'code' in error) return String((error as { code: string }).code)
  return ''
}

function authErrorText(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return ''
}

function isPhoneCaptchaError(error: unknown) {
  const code = authErrorCode(error)
  const text = authErrorText(error)
  return (
    code === 'auth/captcha-check-failed' ||
    code === 'auth/invalid-app-credential' ||
    code === 'auth/missing-recaptcha-token' ||
    /INVALID_APP_CREDENTIAL|CAPTCHA_CHECK_FAILED|MISSING_CLIENT_IDENTIFIER/i.test(text)
  )
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
  if (isPhoneCaptchaError(error)) {
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

export function resetPhoneVerifier() {
  if (widgetId == null) return
  try {
    grecaptchaApi()?.reset(widgetId)
  } catch {
    // Widget may already be gone.
  }
}

export function clearPhoneAuth() {
  confirmation = null
  try {
    verifier?.clear()
  } catch {
    // Recaptcha may already be gone with the node.
  }
  verifier = null
  widgetId = null
}

export async function ensurePhoneVerifier(anchor: HTMLElement) {
  if (verifier) {
    widgetId = await verifier.render()
    return verifier
  }
  const auth = getFirebaseAuth()
  auth.useDeviceLanguage()
  verifier = new RecaptchaVerifier(auth, anchor, {
    size: 'invisible',
    callback: () => undefined,
    'expired-callback': () => resetPhoneVerifier(),
  })
  widgetId = await verifier.render()
  return verifier
}

export async function sendPhoneCode(e164: string) {
  if (!isValidE164(e164)) throw new Error('Enter a valid phone number, including country code.')
  const anchor = document.getElementById(PHONE_SEND_BUTTON_ID)
  if (!anchor) throw new Error('Phone verification is still loading. Try again.')
  const appVerifier = await ensurePhoneVerifier(anchor)
  const auth = getFirebaseAuth()
  try {
    confirmation = await signInWithPhoneNumber(auth, e164, appVerifier)
    resetPhoneVerifier()
  } catch (error) {
    confirmation = null
    resetPhoneVerifier()
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
