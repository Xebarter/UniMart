'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { AuthDivider, GoogleAuthButton } from '@/components/google-auth-button'
import { PasswordInput } from '@/components/password-input'
import { PhoneAuthForm } from '@/components/phone-auth-form'
import { signInWithEmailPassword } from '@/lib/auth-client'

export function AuthPrompt({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    setMessage('')
    setLoading(false)
    setEmailOpen(false)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!open) return null

  async function finish() {
    setLoading(true)
    try {
      await onSuccess()
    } catch {
      setLoading(false)
      setMessage('Unable to continue. Please try again.')
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const result = await signInWithEmailPassword(email, password)
    if (!result.ok) {
      setLoading(false)
      setMessage(result.message)
      return
    }
    await finish()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:px-4">
      <button type="button" aria-label="Close" onClick={onClose} className="auth-overlay absolute inset-0 bg-[#0c1c19]/55 backdrop-blur-[8px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-prompt-title"
        className="auth-sheet relative w-full overflow-x-clip overflow-y-auto rounded-t-[28px] bg-white shadow-[0_-18px_80px_rgba(12,28,25,0.28)] sm:max-w-[420px] sm:rounded-[28px] sm:shadow-[0_28px_80px_rgba(12,28,25,0.28)]"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="relative px-6 pb-6 pt-5 sm:px-7 sm:pt-7">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#e4ebe8] sm:hidden" />
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[#f3c8ad]/35 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 top-10 h-28 w-28 rounded-full bg-[#315e55]/10 blur-2xl" />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-[#e8eeeb] bg-white text-[#6e8079] transition hover:bg-[#f4f7f6]"
          >
            <X size={16} />
          </button>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d1734b]">UniMart</p>
          <h2 id="auth-prompt-title" className="mt-2 font-display text-[1.65rem] font-bold tracking-[-0.04em] text-[#243e39]">
            Continue to post
          </h2>
          <p className="mt-2 max-w-[20rem] text-sm leading-6 text-[#748780]">
            Sign in with your phone, then your listing goes live.
          </p>
          <div className="mt-6">
            <PhoneAuthForm onError={setMessage} onSuccess={() => finish()} sendLabel="Send code" />
          </div>
          {message && !emailOpen ? <p role="alert" className="mt-4 text-sm text-[#c45b38]">{message}</p> : null}
          <AuthDivider />
          <GoogleAuthButton
            label="Continue with Google"
            className="mt-0"
            onError={setMessage}
            onSuccess={() => finish()}
          />
          {emailOpen ? (
            <form onSubmit={submit} className="mt-5 space-y-3.5">
              <label className="block text-[13px] font-semibold text-[#2e4942]">
                Email
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#e4e9e6] bg-[#fbfcfb] px-3 text-sm outline-none focus:border-[#7fa59a] focus:ring-2 focus:ring-[#dcebe6]"
                />
              </label>
              <label className="block text-[13px] font-semibold text-[#2e4942]">
                Password
                <PasswordInput required value={password} onChange={setPassword} autoComplete="current-password" />
              </label>
              {message && <p role="alert" className="text-sm text-[#c45b38]">{message}</p>}
              <button
                disabled={loading}
                className="h-11 w-full rounded-xl bg-[#315e55] text-sm font-bold text-white transition hover:bg-[#274c44] disabled:opacity-60"
              >
                {loading ? 'Continuing…' : 'Continue with email'}
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
        </div>
      </div>
    </div>
  )
}
