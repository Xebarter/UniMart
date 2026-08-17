'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Clock3, Flag, MessagesSquare, ShoppingBag } from 'lucide-react'
import { AdminButton } from '@/components/admin/filter-bar'
import { PageHeader } from '@/components/admin/page-header'
import { useAdminResource } from '@/components/admin/use-resource'
import { EmptyState } from '@/components/admin/empty-state'
import { Avatar } from '@/components/market/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { colorFromSeed, formatDateTime, formatUGX, timeAgo } from '@/lib/format'
import type { Conversation, Message } from '@/lib/types'

type Thread = { data: Conversation; messages: Message[] }

function listingOf(conversation: Conversation) {
  const listing = conversation.listing as Conversation['listing'] | Conversation['listing'][] | null
  if (Array.isArray(listing)) return listing[0] ?? null
  return listing ?? null
}

const BORDERS = ['#315e55', '#d1734b', '#7fa2a6', '#80649c']

function senderAccent(senderId: string) {
  let hash = 0
  for (let index = 0; index < senderId.length; index += 1) hash = (hash * 31 + senderId.charCodeAt(index)) >>> 0
  return BORDERS[hash % BORDERS.length]
}

export function MessageThreadView() {
  const { id } = useParams<{ id: string }>()
  const { data, error, loading } = useAdminResource(() => api.adminThread(id), [id])
  const thread = data as Thread | null

  if (loading && !thread) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-[22px]" />
          <Skeleton className="h-24 rounded-[22px]" />
        </div>
        <Skeleton className="h-[420px] rounded-[24px]" />
      </div>
    )
  }
  if (error) {
    return <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">{error}</div>
  }
  if (!thread) return null

  const conversation = thread.data
  const listing = listingOf(conversation)
  const members = conversation.conversation_members ?? []
  const names = new Map(members.map((member) => [member.user_id, member.profiles?.display_name ?? 'Unknown']))
  const avatars = new Map(members.map((member) => [member.user_id, member.profiles?.avatar_url ?? null]))
  const title = listing?.title || 'Direct message'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Trust & safety / Thread"
        title={title}
        description={`${members.map((member) => member.profiles?.display_name).filter(Boolean).join(' · ') || 'Participants unavailable'} · ${thread.messages.length} ${thread.messages.length === 1 ? 'message' : 'messages'}`}
        actions={(
          <div className="flex flex-wrap gap-2">
            <AdminButton href={adminPaths.messages}>
              <ArrowLeft size={14} />
              Inbox
            </AdminButton>
            {listing?.id ? <AdminButton href={adminPaths.listing(listing.id)}>View listing</AdminButton> : null}
            <AdminButton href={adminPaths.reports}>Reports</AdminButton>
          </div>
        )}
      />

      <div className="rounded-2xl border border-[#e8efe9] bg-[#f4f8f6] px-4 py-3 text-[12px] leading-5 text-[#638076]">
        <Flag size={13} className="mr-1.5 inline -translate-y-px" />
        This read-only view is written to the audit log. Do not treat it as a live inbox.
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[22px] border border-[#e5eae7] bg-white p-4 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">Participants</p>
          <div className="mt-3 flex flex-col gap-2">
            {members.map((member) => (
              <Link
                key={member.user_id}
                href={adminPaths.user(member.user_id)}
                className="flex items-center gap-3 rounded-2xl border border-[#eef3f0] bg-[#f8fbf9] px-3 py-2.5 transition hover:border-[#c8dbd4] hover:bg-white"
              >
                <Avatar name={member.profiles?.display_name} color={colorFromSeed(member.user_id)} image={member.profiles?.avatar_url} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[#243e39]">{member.profiles?.display_name ?? 'Unknown'}</span>
                  <span className="block text-[11px] text-[#8b9994]">Open profile</span>
                </span>
              </Link>
            ))}
            {!members.length ? <p className="text-sm text-[#8b9994]">No members on this thread.</p> : null}
          </div>
        </div>

        <div className="rounded-[22px] border border-[#e5eae7] bg-white p-4 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">Context</p>
          {listing ? (
            <Link href={adminPaths.listing(listing.id)} className="mt-3 block rounded-2xl border border-[#eef3f0] bg-[#f8fbf9] p-3.5 transition hover:border-[#c8dbd4] hover:bg-white">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#315e55]">
                <ShoppingBag size={12} />
                {listing.category}
              </span>
              <span className="mt-2 block font-display text-base font-bold text-[#243e39]">{listing.title}</span>
              <span className="mt-1 block text-sm font-bold text-[#d1734b]">{formatUGX(Number(listing.price))}</span>
            </Link>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[#748780]">This is a direct message with no listing attached.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-[12px] text-[#8b9994]">
            <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> Started {formatDateTime(conversation.created_at)}</span>
            <span>Last activity {timeAgo(conversation.updated_at)}</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
        <div className="border-b border-[#edf1ef] px-4 py-3.5 sm:px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Transcript</p>
          <p className="mt-0.5 text-sm font-bold text-[#29463f]">Case file, oldest first</p>
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          {thread.messages.map((message) => {
            const name = names.get(message.sender_id) ?? message.sender_id.slice(0, 8)
            const accent = senderAccent(message.sender_id)
            return (
              <article key={message.id} className="rounded-2xl border border-[#eef3f0] bg-[#f8fbf9] p-4" style={{ borderLeftWidth: 3, borderLeftColor: accent }}>
                <div className="flex items-start justify-between gap-3">
                  <Link href={adminPaths.user(message.sender_id)} className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={name} color={colorFromSeed(message.sender_id)} image={avatars.get(message.sender_id)} small />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-[#315e55]">{name}</span>
                      <span className="block text-[11px] text-[#8b9994]">{timeAgo(message.created_at)}</span>
                    </span>
                  </Link>
                  <time className="shrink-0 text-[11px] text-[#8b9994]">{formatDateTime(message.created_at)}</time>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#29463f]">{message.body}</p>
              </article>
            )
          })}
          {!thread.messages.length ? (
            <EmptyState icon={MessagesSquare} title="No messages in this thread" description="The conversation exists, but nobody has written yet." />
          ) : null}
        </div>
      </div>
    </div>
  )
}
