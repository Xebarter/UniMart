'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'

const COPY = {
  paid: {
    title: 'Payment received',
    body: 'Your listing is now featured for the next 7 days.',
  },
  pending: {
    title: 'Confirming your card payment',
    body: 'Stay on this page. We are checking the card network — this usually takes a few seconds.',
  },
  failed: {
    title: 'Payment did not go through',
    body: 'Please try again or choose another payment method.',
  },
  cancelled: {
    title: 'Payment cancelled',
    body: 'No charge was made. You can try promoting the listing again anytime.',
  },
  expired: {
    title: 'Payment expired',
    body: 'The card checkout timed out. Start again from your listing to promote it.',
  },
} as const

export function PaymentResult({
  paymentId,
  fallback,
  title,
  body,
}: {
  paymentId?: string
  fallback: 'paid' | 'pending' | 'failed' | 'cancelled' | 'expired'
  title: string
  body: string
}) {
  const [status, setStatus] = useState(fallback)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!paymentId) return
    let cancelled = false
    let attempts = 0
    const tick = async () => {
      attempts += 1
      try {
        const response = await fetch(`/api/payments/status?payment_id=${paymentId}`)
        const payload = await response.json()
        if (cancelled) return
        const next = payload.data?.status as typeof status | undefined
        if (next) {
          setStatus(next)
          if (next !== 'pending') return
        }
      } catch {
        // Keep polling while DPO BackURL or verifyToken catches up.
      }
      if (cancelled) return
      if (attempts < 40) window.setTimeout(() => { void tick() }, 3000)
      else setTimedOut(true)
    }
    void tick()
    return () => { cancelled = true }
  }, [paymentId])

  const copy = COPY[status] ?? { title, body }
  const pending = status === 'pending'

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center">
        <BrandLogo size={48} className="justify-center" />
        <h1 className="mt-5 font-display text-2xl font-bold text-foreground">{copy.title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {pending && timedOut
            ? 'We are still confirming with the card network. If the charge went through, your listing will be featured shortly.'
            : copy.body}
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
          Back to UniMart
        </Link>
      </div>
    </main>
  )
}
