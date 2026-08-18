'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { AuthShell } from '@/components/auth-shell'
import { AuthDivider, GoogleAuthButton } from '@/components/google-auth-button'
import { PasswordInput } from '@/components/password-input'
import { PhoneAuthForm } from '@/components/phone-auth-form'
import { getSafeNextPath } from '@/lib/auth'
import { signInWithEmailPassword } from '@/lib/auth-client'
import { consumeGoogleAuthError } from '@/lib/google-auth-client'
import { createClient } from '@/lib/supabase/client'

const field =
  'mt-1.5 h-12 w-full rounded-2xl border border-[#e5eae7] bg-[#fbfcfb] px-3.5 text-sm text-[#243e39] outline-none focus:border-[#7fa59a] focus:ring-2 focus:ring-[#dcebe6]'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [nextPath, setNextPath] = useState('/')

  useEffect(() => {
    const googleError = consumeGoogleAuthError()
    if (googleError) setMessage(googleError)
    const next = getSafeNextPath(new URLSearchParams(window.location.search).get('next'))
    setNextPath(next)
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) window.location.replace(next)
    })
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const next = getSafeNextPath(new URLSearchParams(window.location.search).get('next'))
    const result = await signInWithEmailPassword(email, password)
    if (!result.ok) {
      setLoading(false)
      setMessage(result.message)
      return
    }
    window.location.href = next
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      description="Enter your mobile number and we’ll text you a 6-digit code."
      footer={
        <>
          New here?{' '}
          <Link className="font-bold text-[#315e55]" href={`/auth/sign-up?next=${encodeURIComponent(nextPath)}`}>
            Create an account
          </Link>
        </>
      }
    >
      <PhoneAuthForm onError={setMessage} />
      {message && !emailOpen ? <p role="alert" className="mt-4 text-sm text-[#c45b38]">{message}</p> : null}
      <AuthDivider />
      <GoogleAuthButton label="Continue with Google" className="mt-0" onError={setMessage} />
      {emailOpen ? (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-[13px] font-bold text-[#2e4942]">
            Email
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={field} />
          </label>
          <label className="block text-[13px] font-bold text-[#2e4942]">
            Password
            <PasswordInput required value={password} onChange={setPassword} autoComplete="current-password" className={field} />
          </label>
          {message ? <p role="alert" className="text-sm text-[#c45b38]">{message}</p> : null}
          <button disabled={loading} className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#315e55] text-sm font-bold text-white transition hover:bg-[#274c44] disabled:opacity-60">
            {loading ? 'Signing in…' : 'Sign in with email'}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => { setEmailOpen(true); setMessage('') }}
          className="mt-4 w-full text-center text-[13px] font-bold text-[#315e55]"
        >
          Use email and password
        </button>
      )}
    </AuthShell>
  )
}
