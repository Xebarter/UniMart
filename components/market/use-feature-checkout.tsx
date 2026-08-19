'use client'

import { Check, CreditCard, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api-client'
import { isFeatured } from '@/lib/format'
import { formatPhoneDisplay, hasContactPhone } from '@/lib/phone'
import { useMarket } from '@/components/market/provider'

export type FeatureCheckoutPhase = 'idle' | 'sending' | 'waiting' | 'confirming' | 'success' | 'failed'

const POLL_MS = 2000
const POLL_ATTEMPTS = 90
const CONFIRMING_AFTER_MS = 12000
const SUCCESS_HOLD_MS = 1200

function FeatureProgress({
  phase,
  phone,
  compact = false,
}: {
  phase: FeatureCheckoutPhase
  phone?: string
  compact?: boolean
}) {
  const step = phase === 'sending' ? 0 : phase === 'success' ? 2 : 1
  const title = phase === 'sending'
    ? 'Sending prompt'
    : phase === 'confirming'
      ? 'Confirming'
      : phase === 'success'
        ? 'Featured for 7 days'
        : `Enter PIN on ${phone ? formatPhoneDisplay(phone) : 'your phone'}`

  if (phase === 'success') {
    return (
      <div className={`rounded-2xl border border-[#d7ece3] bg-[#f4fbf7] text-center ${compact ? 'px-3 py-3' : 'px-4 py-5'}`}>
        <span className="post-success-mark mx-auto flex size-11 items-center justify-center rounded-full bg-[#315e55] text-white">
          <Check size={20} strokeWidth={2.6} />
        </span>
        <p className={`font-display font-bold text-[#243e39] ${compact ? 'mt-2 text-sm' : 'mt-3 text-base'}`}>{title}</p>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border border-[#dfe7e3] bg-[#f7fbf9] ${compact ? 'px-3 py-3' : 'px-4 py-4'}`}>
      <p className={`font-bold text-[#243e39] ${compact ? 'text-xs' : 'text-sm'}`}>{title}</p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#dce8e3]">
        <div className="feature-progress-bar h-full w-1/3 rounded-full bg-[#d1734b]" />
      </div>
      <ol className="mt-3 flex items-center justify-between gap-2">
        {(['Sent', 'PIN', 'Paid'] as const).map((label, index) => {
          const done = index < step
          const active = index === step
          return (
            <li key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className={`h-1.5 w-full rounded-full ${done || active ? 'bg-[#d1734b]' : 'bg-[#dce8e3]'} ${active ? 'animate-pulse' : ''}`} />
              <span className={`text-[10px] font-bold ${done || active ? 'text-[#315e55]' : 'text-[#9aa7a2]'}`}>{label}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function useFeatureCheckout({
  listingId,
  onPaid,
  onNeedPhone,
}: {
  listingId: string
  onPaid?: () => void
  onNeedPhone?: () => void
}) {
  const { profile, updateMyListing, refresh } = useMarket()
  const onPaidRef = useRef(onPaid)
  onPaidRef.current = onPaid
  const onNeedPhoneRef = useRef(onNeedPhone)
  onNeedPhoneRef.current = onNeedPhone
  const listingIdRef = useRef(listingId)
  listingIdRef.current = listingId
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<FeatureCheckoutPhase>('idle')
  const [pending, setPending] = useState<{ paymentId: string; phone?: string } | null>(null)

  useEffect(() => {
    if (!pending) return
    let cancelled = false
    let attempts = 0
    const confirmTimer = window.setTimeout(() => {
      setPhase((current) => (current === 'waiting' ? 'confirming' : current))
    }, CONFIRMING_AFTER_MS)

    const finishPaid = async () => {
      setPhase('success')
      try {
        const result = await api.listing(listingIdRef.current)
        updateMyListing(result.data)
      } catch {
        // Badge still applies after refresh.
      }
      void refresh()
      window.setTimeout(() => {
        if (cancelled) return
        onPaidRef.current?.()
        setPending(null)
        setPhase('idle')
      }, SUCCESS_HOLD_MS)
    }

    const tick = async () => {
      attempts += 1
      try {
        const result = await api.paymentStatus(pending.paymentId)
        if (cancelled) return
        const status = result.data?.status
        if (status === 'paid') {
          window.clearTimeout(confirmTimer)
          await finishPaid()
          return
        }
        if (status === 'failed' || status === 'cancelled' || status === 'expired') {
          setPending(null)
          setPhase('failed')
          setError('Didn’t go through')
          return
        }
      } catch {
        // Keep polling while the webhook or status lookup catches up.
      }
      if (cancelled) return
      if (attempts < POLL_ATTEMPTS) window.setTimeout(() => { void tick() }, POLL_MS)
      else {
        try {
          const listing = await api.listing(listingIdRef.current)
          if (!cancelled && isFeatured(listing.data)) {
            window.clearTimeout(confirmTimer)
            await finishPaid()
            return
          }
        } catch {
          // Listing lookup is only a last check for a late Paytota webhook.
        }
        if (cancelled) return
        setPending(null)
        setPhase('failed')
        setError('Couldn’t confirm yet. If you paid, the listing will feature shortly.')
      }
    }
    void tick()
    return () => {
      cancelled = true
      window.clearTimeout(confirmTimer)
    }
  }, [pending, refresh, updateMyListing])

  async function pay(method: 'mobile_money' | 'card') {
    if (method === 'mobile_money' && !hasContactPhone(profile?.phone_primary)) {
      onNeedPhoneRef.current?.()
      setError('Add a mobile money number first.')
      return
    }
    setBusy(true)
    setError('')
    setPhase('sending')
    try {
      const result = await api.checkout({ listing_id: listingId, method })
      if (method === 'card') {
        if (!result.checkout_url) throw new Error('Unable to start checkout. Please try again.')
        window.location.href = result.checkout_url
        return
      }
      if (!result.payment_id) throw new Error('Unable to send the mobile money prompt.')
      setPending({ paymentId: result.payment_id, phone: result.phone })
      setPhase('waiting')
    } catch (err) {
      setPhase('failed')
      setError(err instanceof Error ? err.message : 'Didn’t go through')
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setPending(null)
    setError('')
    setBusy(false)
    setPhase('idle')
  }

  return { busy, error, pending, phase, pay, reset }
}

export function FeaturePayButtons({
  checkout,
  compact = false,
}: {
  checkout: ReturnType<typeof useFeatureCheckout>
  compact?: boolean
}) {
  const inFlight = checkout.phase === 'sending' || checkout.phase === 'waiting' || checkout.phase === 'confirming' || checkout.phase === 'success'

  if (inFlight) {
    return (
      <div className={compact ? 'space-y-2' : 'mt-5 space-y-3'}>
        <FeatureProgress phase={checkout.phase} phone={checkout.pending?.phone} compact={compact} />
      </div>
    )
  }

  if (compact) {
    return (
      <div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={checkout.busy} onClick={() => { void checkout.pay('mobile_money') }} className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-white px-2 py-2.5 text-[11px] font-bold text-[#315e55] disabled:opacity-60 sm:gap-2 sm:text-xs">
            <Smartphone size={15} className="shrink-0" /> <span className="truncate">Mobile money</span>
          </button>
          <button type="button" disabled={checkout.busy} onClick={() => { void checkout.pay('card') }} className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-white px-2 py-2.5 text-[11px] font-bold text-[#315e55] disabled:opacity-60 sm:gap-2 sm:text-xs">
            <CreditCard size={15} className="shrink-0" /> Card
          </button>
        </div>
        {checkout.error ? <p className="mt-2 text-[11px] font-medium text-[#c86c48]">{checkout.error}</p> : null}
      </div>
    )
  }

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" disabled={checkout.busy} onClick={() => { void checkout.pay('mobile_money') }} className="flex flex-col items-center gap-2 rounded-2xl border border-[#dfe7e3] bg-[#fbfcfb] px-3 py-4 text-xs font-bold text-[#315e55] transition hover:border-[#8bb4a7] disabled:opacity-60">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#e7f0ed] text-[#315e55]"><Smartphone size={20} /></span>
          Mobile money
        </button>
        <button type="button" disabled={checkout.busy} onClick={() => { void checkout.pay('card') }} className="flex flex-col items-center gap-2 rounded-2xl border border-[#dfe7e3] bg-[#fbfcfb] px-3 py-4 text-xs font-bold text-[#315e55] transition hover:border-[#8bb4a7] disabled:opacity-60">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#fff5f0] text-[#d1734b]"><CreditCard size={20} /></span>
          Card
        </button>
      </div>
      {checkout.error ? <p className="mt-3 text-[11px] font-medium text-[#c86c48]">{checkout.error}</p> : null}
    </>
  )
}
