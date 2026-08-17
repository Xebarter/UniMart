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
import { formatDateTime, formatUGX, listingPhotos } from '@/lib/format'
import type { Listing, Payment, Report } from '@/lib/types'

type Listing360 = { data: Listing; reports: Report[]; payments: Payment[] }

const STATUSES = ['active', 'pending', 'draft', 'sold', 'archived', 'removed'] as const

export function ListingDetailView() {
  const { id } = useParams<{ id: string }>()
  const { data, error, loading, reload } = useAdminResource(() => api.adminListing(id), [id])
  const [busy, setBusy] = useState(false)
  const listing = (data as Listing360 | null)?.data
  const reports = (data as Listing360 | null)?.reports ?? []
  const payments = (data as Listing360 | null)?.payments ?? []
  const photos = listing ? listingPhotos(listing) : []

  async function update(body: Record<string, unknown>) {
    setBusy(true)
    try {
      await api.moderateListing(id, body)
      await reload()
    } finally {
      setBusy(false)
    }
  }

  if (loading && !listing) return <p className="text-sm text-[#8b9994]">Loading listing…</p>
  if (error) return <p className="text-sm text-[#d1734b]">{error}</p>
  if (!listing) return null

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketplace / Listing"
        title={listing.title}
        description={listing.description.slice(0, 180) || 'No description'}
        actions={(
          <div className="flex flex-wrap gap-2">
            <select disabled={busy} value={listing.status} onChange={(event) => void update({ status: event.target.value })} className="h-9 rounded-xl border border-[#dfe7e3] bg-white px-3 text-xs font-bold">
              {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            {listing.featured_until ? (
              <button type="button" disabled={busy} onClick={() => void update({ featured_until: null })} className="rounded-xl border border-[#dfe7e3] bg-white px-3 py-2 text-xs font-bold text-[#638076]">Clear feature</button>
            ) : null}
          </div>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Meta label="Price" value={formatUGX(Number(listing.price), listing.currency)} />
        <Meta label="Status" value={<StatusBadge value={listing.status} />} />
        <Meta label="Views" value={listing.view_count.toLocaleString()} />
        <Meta label="Created" value={formatDateTime(listing.created_at)} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader><CardTitle>Media</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            {photos.slice(0, 6).map((photo, index) => (
              <div key={index} className="aspect-square overflow-hidden rounded-xl bg-[#edf1ef]" style={photo.startsWith('linear') ? { background: photo } : undefined}>
                {!photo.startsWith('linear') ? <img src={photo} alt="" className="size-full object-cover" /> : null}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Owner</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {listing.profiles ? <Link href={adminPaths.user(listing.profiles.id)} className="font-semibold text-[#315e55]">{listing.profiles.display_name}</Link> : '—'}
            <p className="text-xs text-[#8b9994]">{listing.location || 'No location'}</p>
            <p className="text-xs text-[#8b9994]">Featured until {listing.featured_until ? formatDateTime(listing.featured_until) : '—'}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Reports</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {reports.length ? reports.map((report) => (
              <Link key={report.id} href={adminPaths.report(report.id)} className="flex justify-between text-sm">
                <span>{report.reason}</span>
                <StatusBadge value={report.status} />
              </Link>
            )) : <p className="text-xs text-[#8b9994]">No reports on this listing.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {payments.length ? payments.map((payment) => (
              <Link key={payment.id} href={adminPaths.payment(payment.id)} className="flex justify-between text-sm">
                <span>{formatUGX(payment.amount, payment.currency)}</span>
                <StatusBadge value={payment.status} />
              </Link>
            )) : <p className="text-xs text-[#8b9994]">No payments tied to this listing.</p>}
          </CardContent>
        </Card>
      </div>
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
