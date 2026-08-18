'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, Download, Mail } from 'lucide-react'
import { AdminButton, FilterBar, FilterSelect } from '@/components/admin/filter-bar'
import { EmptyState } from '@/components/admin/empty-state'
import { InsightTile } from '@/components/admin/insight-tile'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { useListParams } from '@/components/admin/use-list-params'
import { useAdminResource } from '@/components/admin/use-resource'
import { Skeleton } from '@/components/ui/skeleton'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { formatDateTime, timeAgo } from '@/lib/format'
import type { NewsletterSubscriber, Paginated } from '@/lib/types'

type Payload = Paginated<NewsletterSubscriber> & {
  counts?: { subscribed: number; unsubscribed: number; pending: number }
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: 'subscribed', label: 'Subscribed' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
  { value: 'pending', label: 'Pending' },
]

const SOURCE_OPTIONS = [
  { value: 'all', label: 'Any source' },
  { value: 'footer', label: 'Footer' },
  { value: 'settings', label: 'Settings' },
  { value: 'admin', label: 'Admin' },
]

export function SubscribersListView() {
  const { page, pageSize, q, get, setParams, queryString } = useListParams()
  const status = get('status', 'all')
  const source = get('source', 'all')
  const { data, error, loading } = useAdminResource(() => api.adminSubscribers(queryString), [queryString])
  const result = data as Payload | null
  const rows = result?.data ?? []
  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const counts = result?.counts
  const exportHref = `/api/admin/export?type=subscribers${queryString ? `&${queryString}` : ''}`

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content / Subscribers"
        title="Email list"
        description="People who opted in from the footer or Settings for deals, features, and seller tips."
        actions={(
          <AdminButton href={exportHref}>
            <Download size={14} />
            Export CSV
          </AdminButton>
        )}
      />

      {error ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">{error}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <InsightTile
          label="Subscribed"
          value={String(counts?.subscribed ?? 0)}
          hint="Currently opted in"
          icon={Mail}
          accent="green"
          active={status === 'subscribed'}
          onClick={() => setParams({ status: 'subscribed' })}
        />
        <InsightTile
          label="Unsubscribed"
          value={String(counts?.unsubscribed ?? 0)}
          hint="Opted out"
          icon={Mail}
          accent="slate"
          active={status === 'unsubscribed'}
          onClick={() => setParams({ status: 'unsubscribed' })}
        />
        <InsightTile
          label="Pending"
          value={String(counts?.pending ?? 0)}
          hint="Awaiting confirm"
          icon={Mail}
          accent="amber"
          active={status === 'pending'}
          onClick={() => setParams({ status: 'pending' })}
        />
      </div>

      <div className="rounded-[24px] border border-[#e5eae7] bg-white p-3 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-4">
        <FilterBar search={q} onSearch={(value) => setParams({ q: value })} searchPlaceholder="Search email or notes">
          <FilterSelect value={status} onChange={(value) => setParams({ status: value })} options={STATUS_OPTIONS} />
          <FilterSelect value={source} onChange={(value) => setParams({ source: value })} options={SOURCE_OPTIONS} />
        </FilterBar>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-[#edf1ef] bg-[#f8fbf9] text-[10px] uppercase tracking-[0.12em] text-[#8b9994]">
              <tr>
                <th className="px-5 py-3 font-bold">Email</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Source</th>
                <th className="px-5 py-3 font-bold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#f3f6f4]">
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-28" /></td>
                  </tr>
                ))
              ) : rows.map((row) => (
                <tr key={row.id} className="border-b border-[#f3f6f4] last:border-0 transition hover:bg-[#f8fbf9]">
                  <td className="px-5 py-3.5">
                    <Link href={adminPaths.subscriber(row.id)} className="block font-display text-sm font-bold text-[#243e39]">
                      {row.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge value={row.status} /></td>
                  <td className="px-4 py-3.5 capitalize text-[13px] font-semibold text-[#5f746c]">{row.source}</td>
                  <td className="px-5 py-3.5">
                    <span className="block text-[13px] font-semibold text-[#3d5650]">{formatDateTime(row.created_at)}</span>
                    <span className="mt-0.5 block text-[11px] text-[#8b9994]">{timeAgo(row.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-[#f0f4f2] md:hidden">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="px-4 py-3.5"><Skeleton className="h-10 w-full" /></div>
            ))
          ) : rows.map((row) => (
            <Link key={row.id} href={adminPaths.subscriber(row.id)} className="block px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold text-[#243e39]">{row.email}</p>
                  <p className="mt-0.5 text-[11px] capitalize text-[#8b9994]">{row.source}</p>
                </div>
                <StatusBadge value={row.status} />
              </div>
            </Link>
          ))}
        </div>

        {!loading && !rows.length ? (
          <EmptyState
            icon={Mail}
            title="No subscribers yet"
            description="When someone opts in from the footer, they will show up here."
          />
        ) : null}

        <div className="flex items-center justify-between border-t border-[#edf1ef] px-4 py-3 text-xs text-[#8b9994] sm:px-5">
          <p>Showing {from}–{to} of {total.toLocaleString()}</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setParams({ page: page - 1 }, false)} className="rounded-lg border border-[#dfe7e3] p-1.5 text-[#526861] transition hover:bg-[#f7fbf9] disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <span className="font-bold text-[#526861]">{page} / {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => setParams({ page: page + 1 }, false)} className="rounded-lg border border-[#dfe7e3] p-1.5 text-[#526861] transition hover:bg-[#f7fbf9] disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
