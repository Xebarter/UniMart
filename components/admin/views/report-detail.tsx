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
import { formatDateTime } from '@/lib/format'
import type { Report } from '@/lib/types'

type Report360 = { data: Report; related: Report[] }

export function ReportDetailView() {
  const { id } = useParams<{ id: string }>()
  const { data, error, loading, reload } = useAdminResource(() => api.adminReport(id), [id])
  const [busy, setBusy] = useState(false)
  const report = (data as Report360 | null)?.data
  const related = (data as Report360 | null)?.related ?? []

  async function setStatus(status: string) {
    setBusy(true)
    try {
      await api.resolveReport(id, status)
      await reload()
    } finally {
      setBusy(false)
    }
  }

  if (loading && !report) return <p className="text-sm text-[#8b9994]">Loading case…</p>
  if (error) return <p className="text-sm text-[#d1734b]">{error}</p>
  if (!report) return null

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Trust & safety / Case"
        title={report.reason}
        description={report.details || 'No additional details were provided.'}
        actions={(
          <div className="flex flex-wrap gap-2">
            {['open', 'reviewing', 'resolved', 'dismissed'].map((status) => (
              <button key={status} type="button" disabled={busy || report.status === status} onClick={() => void setStatus(status)} className="rounded-xl border border-[#dfe7e3] bg-white px-3 py-2 text-xs font-bold capitalize text-[#638076] disabled:opacity-40">
                {status}
              </button>
            ))}
          </div>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Meta label="Status" value={<StatusBadge value={report.status} />} />
        <Meta label="Opened" value={formatDateTime(report.created_at)} />
        <Meta label="Listing" value={report.listing_id && report.listings ? <Link href={adminPaths.listing(report.listing_id)} className="text-[#315e55]">{report.listings.title}</Link> : '—'} />
        <Meta label="Reported user" value={report.reported_user_id && report.reported_user ? <Link href={adminPaths.user(report.reported_user_id)} className="text-[#315e55]">{report.reported_user.display_name}</Link> : '—'} />
      </div>
      <Card>
        <CardHeader><CardTitle>Reporter</CardTitle></CardHeader>
        <CardContent>
          {report.reporter ? <Link href={adminPaths.user(report.reporter.id)} className="font-semibold text-[#315e55]">{report.reporter.display_name}</Link> : 'Unknown'}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Related reports</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {related.length ? related.map((item) => (
            <Link key={item.id} href={adminPaths.report(item.id)} className="flex justify-between text-sm">
              <span>{item.reason}</span>
              <StatusBadge value={item.status} />
            </Link>
          )) : <p className="text-xs text-[#8b9994]">No related cases.</p>}
        </CardContent>
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
