'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Download, Eye, Flag, ShieldAlert, UserRound, X } from 'lucide-react'
import { AdminButton, FilterBar, FilterSelect } from '@/components/admin/filter-bar'
import { EmptyState } from '@/components/admin/empty-state'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { useListParams } from '@/components/admin/use-list-params'
import { useAdminResource } from '@/components/admin/use-resource'
import { ListingPhoto } from '@/components/listing-photo'
import { Avatar } from '@/components/market/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { colorFromSeed, timeAgo } from '@/lib/format'
import type { Listing, Paginated, Report } from '@/lib/types'

type ReportsPayload = Paginated<Report> & {
  counts?: { open: number; reviewing: number; resolved: number; dismissed: number }
}

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
] as const

export function ReportsListView() {
  const { page, pageSize, q, get, setParams, queryString } = useListParams()
  const status = get('status', 'all')
  const kind = get('kind', 'all')
  const { data, error, loading, reload } = useAdminResource(() => api.adminReports(queryString), [queryString])
  const result = data as ReportsPayload | null
  const rows = result?.data ?? []
  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const counts = result?.counts
  const allCount = (counts?.open ?? 0) + (counts?.reviewing ?? 0) + (counts?.resolved ?? 0) + (counts?.dismissed ?? 0)
  const tabCount = (value: string) => {
    if (!counts) return null
    if (value === 'all') return allCount
    return counts[value as keyof typeof counts]
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Moderation queue"
        description="Triage flags on listings and accounts. Open cases stay at the top of the work."
        actions={(
          <AdminButton href="/api/admin/export?type=reports">
            <Download size={14} />
            Export CSV
          </AdminButton>
        )}
      />
      {error ? <p className="text-sm text-[#d1734b]">{error}</p> : null}

      <div className="overflow-hidden rounded-[24px] border border-[#e2e9e5] bg-white shadow-[0_1px_0_rgba(36,62,57,0.03)]">
        <div className="flex gap-1 overflow-x-auto border-b border-[#edf1ef] px-3 pt-3 sm:px-4">
          {TABS.map((tab) => {
            const active = status === tab.value
            const count = tabCount(tab.value)
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setParams({ status: tab.value })}
                className={`relative shrink-0 rounded-t-xl px-3.5 py-2.5 text-xs font-bold transition ${
                  active ? 'bg-[#f8fbf9] text-[#243e39]' : 'text-[#8b9994] hover:text-[#526861]'
                }`}
              >
                {tab.label}
                {count != null ? (
                  <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-[#edf4f0] text-[#315e55]' : 'bg-[#f1f4f2] text-[#8b9994]'}`}>
                    {count}
                  </span>
                ) : null}
                {active ? <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[#315e55]" /> : null}
              </button>
            )
          })}
        </div>

        <div className="border-b border-[#edf1ef] bg-[#fbfcfb] px-4 py-4 sm:px-5">
          <FilterBar search={q} onSearch={(value) => setParams({ q: value })} searchPlaceholder="Search reason or case details">
            <FilterSelect
              value={kind}
              onChange={(value) => setParams({ kind: value })}
              options={[
                { value: 'all', label: 'All targets' },
                { value: 'listing', label: 'Listings' },
                { value: 'user', label: 'Accounts' },
              ]}
            />
          </FilterBar>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-b border-[#edf1ef] text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b9994]">
                <th className="px-5 py-3">Case</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Reporter</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#f3f6f4]">
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="mt-2 h-3 w-64" />
                    </td>
                    <td className="px-4 py-4"><Skeleton className="h-10 w-40 rounded-xl" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-8 w-32 rounded-full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="ml-auto h-8 w-28" /></td>
                  </tr>
                ))
              ) : rows.map((report) => (
                <ReportRow key={report.id} report={report} onChanged={reload} />
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !rows.length ? (
          <EmptyState
            icon={ShieldAlert}
            title="Queue is clear"
            description="No reports match these filters. New flags from the marketplace will land here for review."
          />
        ) : null}

        <div className="flex items-center justify-between border-t border-[#edf1ef] px-5 py-3.5 text-xs text-[#8b9994]">
          <p>Showing <span className="font-bold text-[#526861]">{from}–{to}</span> of <span className="font-bold text-[#526861]">{total.toLocaleString()}</span></p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setParams({ page: page - 1 }, false)} className="flex size-8 items-center justify-center rounded-lg border border-[#dfe7e3] bg-white disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <span className="min-w-[3.5rem] text-center font-bold text-[#526861]">{page} / {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => setParams({ page: page + 1 }, false)} className="flex size-8 items-center justify-center rounded-lg border border-[#dfe7e3] bg-white disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportRow({ report, onChanged }: { report: Report; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState('')
  const open = report.status === 'open' || report.status === 'reviewing'
  const listing = report.listings as (Listing | null | undefined)

  async function setStatus(status: string) {
    setBusy(status)
    try {
      await api.resolveReport(report.id, status)
      await onChanged()
    } finally {
      setBusy('')
    }
  }

  return (
    <tr className={`group border-b border-[#f3f6f4] last:border-0 hover:bg-[#f8fbf9] ${open ? 'bg-[#fffdfb]' : ''}`}>
      <td className="relative px-5 py-4">
        {open ? <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-[#d1734b]" /> : null}
        <Link href={adminPaths.report(report.id)} className="block min-w-0">
          <span className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#fff2ec] text-[#c86c48]">
              <Flag size={13} />
            </span>
            <span className="truncate font-display text-[15px] font-bold tracking-[-0.02em] text-[#243e39] group-hover:text-[#315e55]">
              {report.reason}
            </span>
          </span>
          <span className="mt-1.5 block max-w-[340px] truncate pl-9 text-[12px] leading-5 text-[#8b9994]">
            {report.details || 'No additional details were provided.'}
          </span>
          <span className="mt-1 block pl-9 text-[10px] font-bold uppercase tracking-[0.12em] text-[#b3bfba]">
            #{report.id.slice(0, 8)} · {timeAgo(report.created_at)}
          </span>
        </Link>
      </td>
      <td className="px-4 py-4">
        {report.listing_id && listing ? (
          <Link href={adminPaths.listing(report.listing_id)} className="flex items-center gap-3">
            <ListingPhoto listing={listing} alt="" className="size-11 rounded-xl" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#29463f]">{listing.title}</span>
              <span className="text-[11px] text-[#8b9994]">Listing</span>
            </span>
          </Link>
        ) : report.reported_user ? (
          <Link href={adminPaths.user(report.reported_user.id)} className="flex items-center gap-3">
            <Avatar name={report.reported_user.display_name} color={colorFromSeed(report.reported_user.id)} image={report.reported_user.avatar_url} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#29463f]">{report.reported_user.display_name}</span>
              <span className="text-[11px] text-[#8b9994]">Account</span>
            </span>
          </Link>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-[#8b9994]">
            <UserRound size={14} /> Unknown target
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        {report.reporter ? (
          <Link href={adminPaths.user(report.reporter.id)} className="flex items-center gap-2.5">
            <Avatar name={report.reporter.display_name} color={colorFromSeed(report.reporter.id)} image={report.reporter.avatar_url} size="sm" />
            <span className="truncate text-sm font-semibold text-[#29463f]">{report.reporter.display_name}</span>
          </Link>
        ) : (
          <span className="text-sm text-[#8b9994]">—</span>
        )}
      </td>
      <td className="px-4 py-4">
        <StatusBadge value={report.status} />
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={adminPaths.report(report.id)}
            className="flex size-8 items-center justify-center rounded-lg border border-[#dfe7e3] bg-white text-[#638076] hover:bg-[#f1f6f3]"
            aria-label="Open case"
          >
            <Eye size={14} />
          </Link>
          {open ? (
            <>
              {report.status === 'open' ? (
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void setStatus('reviewing')}
                  className="h-8 rounded-lg border border-[#dfe7e3] bg-white px-2.5 text-[11px] font-bold text-[#638076] hover:bg-[#f1f6f3] disabled:opacity-50"
                >
                  {busy === 'reviewing' ? '…' : 'Review'}
                </button>
              ) : null}
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void setStatus('resolved')}
                className="flex size-8 items-center justify-center rounded-lg bg-[#315e55] text-white hover:bg-[#294f48] disabled:opacity-50"
                aria-label="Resolve"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void setStatus('dismissed')}
                className="flex size-8 items-center justify-center rounded-lg border border-[#f0c7b3] bg-[#fff8f5] text-[#c86c48] hover:bg-[#fff2ec] disabled:opacity-50"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </>
          ) : null}
        </div>
      </td>
    </tr>
  )
}
