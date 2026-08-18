'use client'

import { FormEvent, useEffect, useState } from 'react'
import { BrandLogo } from '@/components/brand-logo'
import { AuthDivider, GoogleAuthButton } from '@/components/google-auth-button'
import { PasswordInput } from '@/components/password-input'
import { consumeGoogleAuthError } from '@/lib/google-auth-client'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const googleError = consumeGoogleAuthError()
    if (googleError) setMessage(googleError)
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) window.location.replace('/')
    })
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
        data: { display_name: name },
      },
    })
    setLoading(false)
    setMessage(error ? (error.message.toLowerCase().includes('weak') ? error.message : 'Unable to create your account. Please check your details and try again.') : 'Check your email to confirm your account.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-sm">
        <BrandLogo showWordmark wordmarkClassName="text-xl" />
        <h1 className="mt-5 font-display text-3xl font-bold text-foreground">Join the marketplace</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create an account to save listings, post items, and message sellers.</p>
        <GoogleAuthButton label="Continue with Google" onError={setMessage} />
        <AuthDivider />
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">
            Name
            <input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="block text-sm font-semibold">
            Email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <PasswordInput required minLength={8} value={password} onChange={setPassword} autoComplete="new-password" />
          </label>
        </div>
        {message && (
          <p role={message.startsWith('Check') ? 'status' : 'alert'} className={`mt-4 text-sm ${message.startsWith('Check') ? 'text-muted-foreground' : 'text-destructive'}`}>
            {message}
          </p>
        )}
        <button disabled={loading} className="mt-6 h-11 w-full rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-60">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already registered? <a className="font-bold text-primary" href="/auth/login">Sign in</a>
        </p>
      </form>
    </main>
  )
}
