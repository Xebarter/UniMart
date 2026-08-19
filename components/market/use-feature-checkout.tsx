'use client'

import { CreditCard, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api-client'
import { formatPhoneDisplay, hasContactPhone } from '@/lib/phone'
import { useMarket } from '@/components/market/provider'

export function FeatureStkWait({ phone }: { phone?: string }) {
  return (
    <div className="rounded-2xl border border-[#dfe7e3] bg-[#f7fbf9] px-4 py-3">
      <p className="text-sm font-bold text-[#243e39]">Approve on your phone</p>
      <p className="mt-1 text-xs leading-5 text-[#71827b]">
        A pin prompt was sent to {phone ? formatPhoneDisplay(phone) : 'your mobile money number'}. Stay on this page — payment is collected directly, not through a Paytota invoice.
      </p>
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
  const { profile } = useMarket()
  const onPaidRef = useRef(onPaid)
  onPaidRef.current = onPaid
  const onNeedPhoneRef = useRef(onNeedPhone)
  onNeedPhoneRef.current = onNeedPhone
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<{ paymentId: string; phone?: string } | null>(null)

  useEffect(() => {
    if (!pending) return
    let cancelled = false
    let attempts = 0
    const tick = async () => {
      attempts += 1
      try {
        const result = await api.paymentStatus(pending.paymentId)
        if (cancelled) return
        const status = result.data?.status
        if (status === 'paid') {
          setPending(null)
          onPaidRef.current?.()
          return
        }
        if (status === 'failed' || status === 'cancelled' || status === 'expired') {
          setPending(null)
          setError('Mobile money payment did not go through. Try again.')
          return
        }
      } catch {
        // Keep polling while the webhook or status lookup catches up.
      }
      if (!cancelled && attempts < 40) window.setTimeout(() => { void tick() }, 3000)
    }
    void tick()
    return () => { cancelled = true }
  }, [pending])

  async function pay(method: 'mobile_money' | 'card') {
    if (method === 'mobile_money' && !hasContactPhone(profile?.phone_primary)) {
      onNeedPhoneRef.current?.()
      setError('Add a mobile money number first.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await api.checkout({ listing_id: listingId, method })
      if (method === 'card') {
        if (!result.checkout_url) throw new Error('Unable to start checkout. Please try again.')
        window.location.href = result.checkout_url
        return
      }
      if (!result.payment_id) throw new Error('Unable to send the mobile money prompt.')
      setPending({ paymentId: result.payment_id, phone: result.phone })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start checkout. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setPending(null)
    setError('')
    setBusy(false)
  }

  return { busy, error, pending, pay, reset }
}

export function FeaturePayButtons({
  checkout,
  compact = false,
}: {
  checkout: ReturnType<typeof useFeatureCheckout>
  compact?: boolean
}) {
  if (checkout.pending) {
    return (
      <div className={compact ? 'space-y-2' : 'mt-5 space-y-3'}>
        <FeatureStkWait phone={checkout.pending.phone} />
        {checkout.error ? <p className="text-[11px] font-medium text-[#c86c48]">{checkout.error}</p> : null}
      </div>
    )
  }

  if (compact) {
    return (
      <div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={checkout.busy} onClick={() => { void checkout.pay('mobile_money') }} className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-white px-2 py-2.5 text-[11px] font-bold text-[#315e55] disabled:opacity-60 sm:gap-2 sm:text-xs">
            <Smartphone size={15} className="shrink-0" /> <span className="truncate">{checkout.busy ? 'Sending…' : 'Mobile money'}</span>
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
          {checkout.busy ? 'Sending…' : 'Mobile money'}
        </button>
        <button type="button" disabled={checkout.busy} onClick={() => { void checkout.pay('card') }} className="flex flex-col items-center gap-2 rounded-2xl border border-[#dfe7e3] bg-[#fbfcfb] px-3 py-4 text-xs font-bold text-[#315e55] transition hover:border-[#8bb4a7] disabled:opacity-60">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#fff5f0] text-[#d1734b]"><CreditCard size={20} /></span>
          {checkout.busy ? 'Opening…' : 'Card'}
        </button>
      </div>
      {checkout.error ? <p className="mt-3 text-[11px] font-medium text-[#c86c48]">{checkout.error}</p> : null}
    </>
  )
}

