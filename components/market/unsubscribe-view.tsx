'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, MailX } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { api } from '@/lib/api-client'
import { loginHref } from '@/lib/auth'
import { marketPaths } from '@/lib/market-paths'

export function UnsubscribeView() {
  const searchParams = useSearchParams()
  const token = (searchParams.get('token') ?? '').trim()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(Boolean(token))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    api.unsubscribePreview(token)
      .then((result) => {
        setEmail(result.email)
        setStatus(result.status)
        setDone(result.status === 'unsubscribed')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'This unsubscribe link is not valid.'))
      .finally(() => setLoading(false))
  }, [token])

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      const result = await api.unsubscribe(token)
      setStatus(result.status)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to unsubscribe right now.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[720px] px-5 py-10 sm:px-8 sm:py-14">
      <Link href={marketPaths.home} className="inline-block">
        <BrandLogo showWordmark size={34} wordmarkClassName="text-xl" />
      </Link>

      <section className="relative mt-7 overflow-hidden rounded-[28px] bg-[#315e55] px-6 py-8 text-white sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rotate-[-16deg] rounded-[44%] border-[24px] border-[#47766b]/70" />
        <p className="relative z-10 text-[11px] font-bold uppercase tracking-[0.16em] text-[#c7ddd6]">Email updates</p>
        <h1 className="relative z-10 mt-3 font-display text-[2rem] font-bold tracking-[-0.045em] sm:text-[2.6rem]">
          {done ? 'You are unsubscribed.' : 'Stop email updates'}
        </h1>
        <p className="relative z-10 mt-4 max-w-[520px] text-base leading-7 text-[#d4e4df]">
          {done
            ? 'You will no longer get UniMart deals, features, or seller tips at this address.'
            : 'Leave the newsletter anytime. Account and safety messages may still be sent when needed.'}
        </p>
      </section>

      <section className="mt-6 rounded-[28px] border border-[#e5eae7] bg-white p-6 shadow-[0_12px_40px_rgba(36,62,57,0.05)] sm:p-8">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-[#748780]">
            <Loader2 size={16} className="animate-spin" /> Checking this link…
          </p>
        ) : done ? (
          <div className="text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#edf6f1] text-[#315e55]">
              <CheckCircle2 size={22} />
            </span>
            <p className="mt-4 font-display text-lg font-bold text-[#243e39]">Updates stopped</p>
            {email ? <p className="mt-2 text-sm text-[#748780]">{email}</p> : null}
            <Link href={marketPaths.home} className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#315e55] px-5 text-sm font-bold text-white hover:bg-[#274c44]">
              Back to UniMart
            </Link>
          </div>
        ) : token && status ? (
          <div>
            <p className="text-sm leading-6 text-[#5f746c]">
              Unsubscribe <span className="font-semibold text-[#243e39]">{email}</span> from UniMart email updates?
            </p>
            {error ? <p className="mt-3 text-sm text-[#9a4f32]">{error}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirm()}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#d1734b] px-5 text-sm font-bold text-white hover:bg-[#b9623e] disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <MailX size={16} />}
                Unsubscribe
              </button>
              <Link href={marketPaths.home} className="inline-flex h-11 items-center rounded-xl border border-[#dfe7e3] px-5 text-sm font-bold text-[#638076] hover:bg-[#f7fbf9]">
                Keep updates
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm leading-6 text-[#5f746c]">
              Open the unsubscribe link from a UniMart email, or sign in and turn off email updates in Settings.
            </p>
            {error ? <p className="mt-3 text-sm text-[#9a4f32]">{error}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={loginHref('/settings#notifications')} className="inline-flex h-11 items-center rounded-xl bg-[#315e55] px-5 text-sm font-bold text-white hover:bg-[#274c44]">
                Sign in to manage
              </a>
              <Link href="/privacy" className="inline-flex h-11 items-center rounded-xl border border-[#dfe7e3] px-5 text-sm font-bold text-[#638076] hover:bg-[#f7fbf9]">
                Privacy policy
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
