'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'

export function PaymentResult({
  paymentId,
  fallback,
  title,
  body,
}: {
  paymentId?: string
  fallback: 'paid' | 'failed' | 'cancelled'
  title: string
  body: string
}) {
  const [status, setStatus] = useState(fallback)

  useEffect(() => {
    if (!paymentId) return
    fetch(`/api/payments/status?payment_id=${paymentId}`)
      .then((response) => response.json())
      .then((payload) => {
        if (payload.data?.status) setStatus(payload.data.status)
      })
      .catch(() => undefined)
  }, [paymentId])

  const paid = status === 'paid'
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center">
        <BrandLogo size={48} className="justify-center" />
        <h1 className="mt-5 font-display text-2xl font-bold text-foreground">{paid ? 'Payment received' : title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{paid ? 'Your listing is now featured for the next 7 days.' : body}</p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
          Back to UniMart
        </Link>
      </div>
    </main>
  )
}
