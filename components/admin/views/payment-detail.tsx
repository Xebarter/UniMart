'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { useAdminResource } from '@/components/admin/use-resource'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { formatDateTime, formatUGX } from '@/lib/format'
import type { Payment } from '@/lib/types'

export function PaymentDetailView() {
  const { id } = useParams<{ id: string }>()
  const { data, error, loading } = useAdminResource(() => api.adminPayment(id).then((result) => result.data), [id])
  const [openRaw, setOpenRaw] = useState(false)
  const payment = data as Payment | null

  if (loading && !payment) return <p className="text-sm text-[#8b9994]">Loading payment…</p>
  if (error) return <p className="text-sm text-[#d1734b]">{error}</p>
  if (!payment) return null

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Commerce / Payment" title={formatUGX(payment.amount, payment.currency)} description={`${payment.provider} · ${payment.purpose.replaceAll('_', ' ')}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Meta label="Status" value={<StatusBadge value={payment.status} />} />
        <Meta label="Customer" value={payment.profiles ? <Link href={adminPaths.user(payment.user_id)} className="text-[#315e55]">{payment.profiles.display_name}</Link> : '—'} />
        <Meta label="Listing" value={payment.listing_id && payment.listings ? <Link href={adminPaths.listing(payment.listing_id)} className="text-[#315e55]">{payment.listings.title}</Link> : '—'} />
        <Meta label="Paid at" value={formatDateTime(payment.paid_at)} />
      </div>
      <Card>
        <CardHeader><CardTitle>Provider references</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Payment id: {payment.provider_payment_id || '—'}</p>
          <p>Reference: {payment.provider_reference || '—'}</p>
          <p>Created: {formatDateTime(payment.created_at)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Raw payload</CardTitle>
          <button type="button" onClick={() => setOpenRaw((value) => !value)} className="text-xs font-bold text-[#315e55]">{openRaw ? 'Hide' : 'Show'}</button>
        </CardHeader>
        {openRaw ? (
          <CardContent>
            <pre className="overflow-x-auto rounded-xl bg-[#f8fbf9] p-4 text-[11px] leading-5 text-[#526861]">{JSON.stringify(payment.raw ?? {}, null, 2)}</pre>
          </CardContent>
        ) : null}
      </Card>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e2e9e5] bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">{label}</p>
      <div className="mt-2 text-sm font-semibold text-[#29463f]">{value}</div>
    </div>
  )
}
