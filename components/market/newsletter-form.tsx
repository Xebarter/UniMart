'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Check, Loader2, Mail } from 'lucide-react'
import { api } from '@/lib/api-client'
import { marketPaths } from '@/lib/market-paths'

export function NewsletterForm({ source = 'footer' }: { source?: 'footer' | 'settings' }) {
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'ok' | 'already' | 'resumed'>('idle')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await api.subscribe({ email, source, company_website: honeypot })
      if (result.already) setStatus('already')
      else if (result.resumed) setStatus('resumed')
      else setStatus('ok')
      setEmail('')
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Unable to subscribe right now.')
    } finally {
      setBusy(false)
    }
  }

  if (status !== 'idle') {
    const copy = {
      ok: 'You are on the list. Watch your inbox for deals, features, and seller tips.',
      already: 'This email is already subscribed.',
      resumed: 'Welcome back. You are on the list again.',
    }[status]
    return (
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3" role="status">
        <p className="flex items-start gap-2 text-sm leading-6 text-[#d4e4df]">
          <Check size={16} className="mt-0.5 shrink-0 text-[#9dccb8]" />
          {copy}
        </p>
        <p className="mt-2 text-[11px] text-[#6a8f85]">
          You can stop these emails anytime from{' '}
          <Link href={marketPaths.unsubscribe} className="underline decoration-white/20 underline-offset-2 hover:text-white">
            unsubscribe
          </Link>
          {' '}or Settings.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-2 text-[11px] font-semibold text-[#c7ddd6] underline decoration-white/20 underline-offset-2 hover:text-white"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="mt-4">
      <input
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(event) => setHoneypot(event.target.value)}
        className="hidden"
        aria-hidden="true"
      />
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6a8f85]" />
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@email.com"
            aria-label="Email address"
            disabled={busy}
            className="h-11 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.06] pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#5d847a] focus:border-[#4e786a] focus:ring-2 focus:ring-[#315e55]/50 disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#d1734b] px-5 text-xs font-bold text-white transition hover:bg-[#b9623e] disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : null}
          {busy ? 'Saving' : 'Subscribe'}
        </button>
      </div>
      {error ? <p className="mt-2 text-[12px] text-[#f0b696]" role="alert">{error}</p> : null}
      <p className="mt-2 text-[11px] leading-5 text-[#6a8f85]">
        By subscribing you agree to our{' '}
        <Link href="/privacy" className="underline decoration-white/20 underline-offset-2 hover:text-white">privacy policy</Link>
        . Unsubscribe anytime.
      </p>
    </form>
  )
}
