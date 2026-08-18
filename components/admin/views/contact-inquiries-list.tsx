'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { AdminButton, FilterBar, FilterSelect } from '@/components/admin/filter-bar'
import { EmptyState } from '@/components/admin/empty-state'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { useListParams } from '@/components/admin/use-list-params'
import { useAdminResource } from '@/components/admin/use-resource'
import { Skeleton } from '@/components/ui/skeleton'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { formatDateTime, timeAgo } from '@/lib/format'
import type { ContactInquiry, ContactTopic, Paginated } from '@/lib/types'

type Payload = Paginated<ContactInquiry> & {
  counts?: { new: number; reviewing: number; replied: number; closed: number }
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'replied', label: 'Replied' },
  { value: 'closed', label: 'Closed' },
]

export function ContactInquiriesListView() {
  const { page, pageSize, q, get, setParams, queryString } = useListParams()
  const status = get('status', 'all')
  const topicId = get('topic_id', 'all')
  const { data, error, loading } = useAdminResource(() => api.adminContactInquiries(queryString), [queryString])
  const pageCopy = useAdminResource(() => api.adminContactPage(), [])
  const result = data as Payload | null
  const rows = result?.data ?? []
  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const topics = ((pageCopy.data as { topics?: ContactTopic[] } | null)?.topics ?? [])
  const topicOptions = [
    { value: 'all', label: 'All topics' },
    ...topics.map((topic) => ({ value: topic.id, label: topic.label })),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content / Contact"
        title="Inquiries"
        description="Messages submitted from the public /contact form."
        actions={<AdminButton href={adminPaths.contact}>Back to contact page</AdminButton>}
      />

      {error ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">{error}</div>
      ) : null}

      <div className="rounded-[24px] border border-[#e5eae7] bg-white p-3 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-4">
        <FilterBar search={q} onSearch={(value) => setParams({ q: value })} searchPlaceholder="Search name, email, or message">
          <FilterSelect value={status} onChange={(value) => setParams({ status: value })} options={STATUS_OPTIONS} />
          <FilterSelect value={topicId} onChange={(value) => setParams({ topic_id: value })} options={topicOptions} />
        </FilterBar>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-[#edf1ef] bg-[#f8fbf9] text-[10px] uppercase tracking-[0.12em] text-[#8b9994]">
              <tr>
                <th className="px-5 py-3 font-bold">From</th>
                <th className="px-4 py-3 font-bold">Topic</th>
                <th className="px-4 py-3 font-bold">Subject</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold">Received</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#f3f6f4]">
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-28" /></td>
                  </tr>
                ))
              ) : rows.map((row) => (
                <tr key={row.id} className="border-b border-[#f3f6f4] last:border-0 transition hover:bg-[#f8fbf9]">
                  <td className="px-5 py-3.5">
                    <Link href={adminPaths.contactInquiry(row.id)} className="block">
                      <span className="block font-display text-sm font-bold text-[#243e39]">{row.name}</span>
                      <span className="mt-0.5 block text-[11px] text-[#8b9994]">{row.email}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-[13px] font-semibold text-[#5f746c]">{row.contact_topics?.label ?? '—'}</td>
                  <td className="px-4 py-3.5 text-[13px] text-[#5f746c]">{row.subject || '—'}</td>
                  <td className="px-4 py-3.5"><StatusBadge value={row.status} /></td>
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
            <Link key={row.id} href={adminPaths.contactInquiry(row.id)} className="block px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-[#243e39]">{row.name}</p>
                  <p className="mt-0.5 text-[11px] text-[#8b9994]">{row.contact_topics?.label ?? (row.subject || row.email)}</p>
                </div>
                <StatusBadge value={row.status} />
              </div>
            </Link>
          ))}
        </div>

        {!loading && !rows.length ? (
          <EmptyState
            icon={Inbox}
            title="No inquiries yet"
            description="When someone writes from /contact, they will show up here."
            action={<AdminButton href={adminPaths.contact}>Back to contact page</AdminButton>}
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
