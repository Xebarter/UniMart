'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, Flag, MessageSquare, MessagesSquare, ShoppingBag, Users } from 'lucide-react'
import { AdminButton, FilterBar, FilterSelect } from '@/components/admin/filter-bar'
import { InsightTile } from '@/components/admin/insight-tile'
import { PageHeader } from '@/components/admin/page-header'
import { useListParams } from '@/components/admin/use-list-params'
import { useAdminResource } from '@/components/admin/use-resource'
import { EmptyState } from '@/components/admin/empty-state'
import { Avatar } from '@/components/market/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { colorFromSeed, formatDate, timeAgo } from '@/lib/format'
import type { Conversation, Paginated } from '@/lib/types'

const KIND_OPTIONS = [
  { value: 'all', label: 'All threads' },
  { value: 'listing', label: 'Listing chats' },
  { value: 'direct', label: 'Direct messages' },
]

function listingOf(row: Conversation) {
  const listing = row.listing as Conversation['listing'] | Conversation['listing'][] | null
  if (Array.isArray(listing)) return listing[0] ?? null
  return listing ?? null
}

function membersOf(row: Conversation) {
  return row.conversation_members ?? []
}

function namesOf(row: Conversation) {
  const names = membersOf(row).map((member) => member.profiles?.display_name).filter(Boolean) as string[]
  return names.length ? names.join(' · ') : 'Unknown participants'
}

function previewOf(row: Conversation) {
  return row.messages?.[0]?.body?.trim() || 'No messages yet'
}

function FacePile({ row }: { row: Conversation }) {
  const people = membersOf(row).slice(0, 3)
  if (!people.length) {
    return <span className="flex size-10 items-center justify-center rounded-full bg-[#edf4f0] text-[#315e55]"><Users size={16} /></span>
  }
  return (
    <div className="flex shrink-0 -space-x-2.5">
      {people.map((member) => (
        <Avatar
          key={member.user_id}
          name={member.profiles?.display_name}
          color={colorFromSeed(member.user_id)}
          image={member.profiles?.avatar_url}
          className="ring-2 ring-white"
        />
      ))}
    </div>
  )
}

function ThreadCell({ row }: { row: Conversation }) {
  const listing = listingOf(row)
  return (
    <div className="flex min-w-0 items-center gap-3">
      <FacePile row={row} />
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-bold text-[#243e39]">{namesOf(row)}</p>
        <p className="mt-0.5 truncate text-[11px] text-[#8b9994]">{listing?.title || 'Direct message'}</p>
      </div>
    </div>
  )
}

export function MessagesListView() {
  const { page, pageSize, q, get, setParams, queryString } = useListParams()
  const reported = get('reported') === '1'
  const kind = get('kind', 'all')
  const { data, error, loading } = useAdminResource(() => api.adminMessages(queryString), [queryString])
  const result = data as Paginated<Conversation> | null
  const rows = result?.data ?? []
  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const filtered = Boolean(q || reported || kind !== 'all')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Trust & safety / Messages"
        title="Safety inbox"
        description="Look up threads by participant or listing. Opening a conversation is written to the audit log."
        actions={<AdminButton href={adminPaths.reports}>Open reports</AdminButton>}
      />

      {error ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">{error}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightTile
          label="In this view"
          value={loading ? '—' : total.toLocaleString()}
          hint={filtered ? 'Matching filters' : 'Every conversation'}
          icon={MessagesSquare}
          active={!filtered}
          onClick={() => setParams({ reported: undefined, kind: 'all', q: '' })}
        />
        <InsightTile
          label="Reported"
          value={reported && !loading ? total.toLocaleString() : '—'}
          hint="Tied to open reports"
          icon={Flag}
          accent="coral"
          active={reported}
          onClick={() => setParams({ reported: reported ? undefined : '1' })}
        />
        <InsightTile
          label="Listing chats"
          value={kind === 'listing' && !loading ? total.toLocaleString() : '—'}
          hint="About a listing"
          icon={ShoppingBag}
          accent="green"
          active={kind === 'listing'}
          onClick={() => setParams({ kind: kind === 'listing' ? 'all' : 'listing' })}
        />
        <InsightTile
          label="Direct"
          value={kind === 'direct' && !loading ? total.toLocaleString() : '—'}
          hint="No listing attached"
          icon={MessageSquare}
          accent="slate"
          active={kind === 'direct'}
          onClick={() => setParams({ kind: kind === 'direct' ? 'all' : 'direct' })}
        />
      </div>

      <div className="rounded-[24px] border border-[#e5eae7] bg-white p-3 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-4">
        <FilterBar search={q} onSearch={(value) => setParams({ q: value })} searchPlaceholder="Search a participant or listing">
          <FilterSelect value={kind} onChange={(value) => setParams({ kind: value })} options={KIND_OPTIONS} />
          <button
            type="button"
            onClick={() => setParams({ reported: reported ? undefined : '1' })}
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${
              reported
                ? 'border-[#f0c7b3] bg-[#fff5f0] text-[#c86c48]'
                : 'border-[#e5eae7] bg-white text-[#526861] hover:border-[#c8dbd4]'
            }`}
          >
            <Flag size={13} />
            Reported threads
          </button>
        </FilterBar>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#edf1ef] px-4 py-3.5 sm:px-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Inbox</p>
            <p className="mt-0.5 text-sm font-bold text-[#29463f]">
              {loading ? 'Loading threads…' : `${total.toLocaleString()} ${total === 1 ? 'conversation' : 'conversations'}`}
            </p>
          </div>
          <p className="hidden text-[11px] text-[#8b9994] sm:block">Read-only. Every open is audit-logged.</p>
        </div>

        <div className="divide-y divide-[#f0f4f2] md:hidden">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="size-10 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            ))
          ) : rows.map((row) => (
            <Link key={row.id} href={adminPaths.message(row.id)} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#f8fbf9]">
              <ThreadCell row={row} />
              <span className="ml-auto shrink-0 text-[11px] text-[#8b9994]">{timeAgo(row.updated_at)}</span>
            </Link>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-[#edf1ef] bg-[#f8fbf9] text-[10px] uppercase tracking-[0.12em] text-[#8b9994]">
              <tr>
                <th className="px-5 py-3 font-bold">Participants</th>
                <th className="px-4 py-3 font-bold">Context</th>
                <th className="px-4 py-3 font-bold">Latest</th>
                <th className="px-4 py-3 font-bold">Updated</th>
                <th className="px-5 py-3 font-bold"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#f3f6f4]">
                    <td className="px-5 py-3.5"><div className="flex items-center gap-3"><Skeleton className="size-10 rounded-full" /><Skeleton className="h-4 w-40" /></div></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-56" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-3.5" />
                  </tr>
                ))
              ) : rows.map((row) => {
                const listing = listingOf(row)
                return (
                  <tr key={row.id} className="group border-b border-[#f3f6f4] last:border-0 transition hover:bg-[#f8fbf9]">
                    <td className="px-5 py-3.5">
                      <Link href={adminPaths.message(row.id)} className="block">
                        <ThreadCell row={row} />
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={adminPaths.message(row.id)} className="block">
                        {listing ? (
                          <>
                            <span className="inline-flex rounded-full bg-[#edf4f0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#315e55]">{listing.category}</span>
                            <span className="mt-1 block truncate text-[13px] font-semibold text-[#3d5650]">{listing.title}</span>
                          </>
                        ) : (
                          <span className="inline-flex rounded-full border border-[#e5eae7] bg-[#f8fbf9] px-2.5 py-1 text-[11px] font-bold text-[#638076]">Direct message</span>
                        )}
                      </Link>
                    </td>
                    <td className="max-w-[320px] px-4 py-3.5">
                      <Link href={adminPaths.message(row.id)} className="block truncate text-[13px] leading-5 text-[#5f746c]">
                        {previewOf(row)}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={adminPaths.message(row.id)} className="block">
                        <span className="block text-[13px] font-semibold text-[#3d5650]">{formatDate(row.updated_at)}</span>
                        <span className="mt-0.5 block text-[11px] text-[#8b9994]">{timeAgo(row.updated_at)}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={adminPaths.message(row.id)} className="flex size-8 items-center justify-center rounded-full text-[#c3d0cb] transition group-hover:bg-[#eef5f2] group-hover:text-[#315e55]" aria-label={`Open thread ${namesOf(row)}`}>
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!loading && !rows.length ? (
          <EmptyState
            icon={MessagesSquare}
            title="No conversations match this lookup"
            description="Search a participant, switch to listing chats, or review threads tied to open reports."
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
