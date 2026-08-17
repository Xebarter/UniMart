'use client'

import { FormEvent, useEffect, useState } from 'react'
import { BrandLogo } from '@/components/brand-logo'
import { AuthDivider, GoogleAuthButton } from '@/components/google-auth-button'
import { PasswordInput } from '@/components/password-input'
import { getSafeNextPath } from '@/lib/auth'
import { signInWithEmailPassword } from '@/lib/auth-client'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const next = getSafeNextPath(new URLSearchParams(window.location.search).get('next'))
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
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-sm">
        <BrandLogo showWordmark wordmarkClassName="text-xl" />
        <h1 className="mt-5 font-display text-3xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your campus marketplace activity.</p>
        <GoogleAuthButton label="Continue with Google" onError={setMessage} />
        <AuthDivider />
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">
            Email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <PasswordInput required value={password} onChange={setPassword} autoComplete="current-password" />
          </label>
        </div>
        {message && <p role="alert" className="mt-4 text-sm text-destructive">{message}</p>}
        <button disabled={loading} className="mt-6 h-11 w-full rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-60">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          New here? <a className="font-bold text-primary" href="/auth/sign-up">Create an account</a>
        </p>
      </form>
    </main>
  )
}
