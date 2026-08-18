'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Clock3,
  Cog,
  Flag,
  Heart,
  Inbox,
  MessageCircle,
  Search,
  Send,
  Shield,
  ShoppingBag,
  Sparkles,
  UserPlus,
} from 'lucide-react'
import { Avatar } from '@/components/market/avatar'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { createClient } from '@/lib/supabase/client'
import { colorFromSeed, formatUGX, timeAgo } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import type { Conversation, Message, Notification } from '@/lib/types'

const BODY_MAX = 4000
const SUGGESTIONS = ['Is this still available?', 'Can we meet nearby?', 'What is the best price?']

type InboxFilter = 'all' | 'unread'
type Panel = 'inbox' | 'alerts'
type NotificationFilter = 'all' | 'unread' | 'messages' | 'activity' | 'account'

function listingOf(conversation?: Conversation | null) {
  const listing = conversation?.listing as Conversation['listing'] | Conversation['listing'][] | null | undefined
  if (Array.isArray(listing)) return listing[0] ?? null
  return listing ?? null
}

function previewOf(conversation: Conversation) {
  return conversation.messages?.[0]?.body?.trim() || 'No messages yet'
}

function threadClock(value: string) {
  const date = new Date(value)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) return date.toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' })
  const sameYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })
}

function dayLabel(value: string) {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-UG', { weekday: 'short', day: 'numeric', month: 'short' })
}

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function notificationIcon(type: string) {
  if (type === 'message') return MessageCircle
  if (type === 'sale') return ShoppingBag
  if (type === 'favorite') return Heart
  if (type === 'follow') return UserPlus
  return Bell
}

function notificationHref(item: Notification) {
  if (item.path) return item.path
  if (item.conversation_id) return marketPaths.conversation(item.conversation_id)
  if (item.listing_id) return marketPaths.listing(item.listing_id)
  return marketPaths.messages
}

function matchesNotificationFilter(item: Notification, filter: NotificationFilter) {
  if (filter === 'all') return true
  if (filter === 'unread') return !item.read_at
  if (filter === 'messages') return item.type === 'message'
  if (filter === 'account') return item.type === 'account_notice' || item.type === 'report_update'
  return item.type === 'sale' || item.type === 'favorite' || item.type === 'follow'
}

export function MessagesView({
  conversations,
  activeId,
  panel = 'inbox',
}: {
  conversations: Conversation[]
  activeId?: string
  panel?: Panel
}) {
  const router = useRouter()
  const {
    profile,
    notifications,
    notificationPreferences,
    unreadMessages,
    unreadNotes,
    refresh,
    notify,
    markNotificationsRead,
    markNotificationRead,
    saveNotificationPreferences,
  } = useMarket()
  const profileId = profile?.id
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<InboxFilter>('all')
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>('all')
  const [loadingThread, setLoadingThread] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [reporting, setReporting] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return conversations.filter((item) => {
      if (filter === 'unread' && !(item.unread_count ?? 0)) return false
      if (!q) return true
      const listing = listingOf(item)
      const haystack = `${item.other?.display_name ?? ''} ${previewOf(item)} ${listing?.title ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [conversations, filter, query])

  const active = conversations.find((item) => item.id === activeId) ?? null
  const conversationId = active?.id
  const listing = listingOf(active)
  const unreadInbox = conversations.filter((item) => (item.unread_count ?? 0) > 0).length
  const visibleNotifications = useMemo(
    () => notifications.filter((item) => matchesNotificationFilter(item, notificationFilter)),
    [notificationFilter, notifications],
  )

  useEffect(() => {
    if (panel === 'alerts') return
    if (activeId) return
    const first = conversations[0]?.id
    if (!first) return
    if (!window.matchMedia('(min-width: 1024px)').matches) return
    router.replace(marketPaths.conversation(first))
  }, [activeId, conversations, panel, router])

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }
    let cancelled = false
    setLoadingThread(true)
    setError('')
    Promise.all([
      api.messages(conversationId),
      api.markRead(conversationId).catch(() => undefined),
    ])
      .then(([result]) => {
        if (cancelled) return
        setMessages(result.data)
        void refresh()
      })
      .catch((err) => {
        if (cancelled) return
        setMessages([])
        setError(err instanceof Error ? err.message : 'Unable to load this conversation.')
      })
      .finally(() => {
        if (!cancelled) setLoadingThread(false)
      })
    return () => { cancelled = true }
  }, [conversationId, refresh])

  useEffect(() => {
    const node = scrollerRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, conversationId])

  useEffect(() => {
    if (!profileId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`inbox:${profileId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const row = payload.new as Message
        if (row.conversation_id === conversationId) {
          setMessages((current) => (current.some((item) => item.id === row.id) ? current : [...current, row]))
          if (row.sender_id !== profileId) void api.markRead(row.conversation_id).catch(() => undefined)
        }
        void refresh()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const row = payload.new as Notification
        if (row.user_id === profileId) void refresh()
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId, profileId, refresh])

  useEffect(() => {
    if (!profileId) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, 12000)
    return () => window.clearInterval(timer)
  }, [profileId, refresh])

  async function send(body?: string) {
    const text = (body ?? draft).trim()
    if (!active || !text || sending) return
    if (text.length > BODY_MAX) {
      setError(`Keep it under ${BODY_MAX.toLocaleString()} characters.`)
      return
    }
    setSending(true)
    setError('')
    try {
      const result = await api.sendMessage({ conversation_id: active.id, body: text })
      setMessages((current) => (current.some((item) => item.id === result.data.id) ? current : [...current, result.data]))
      setDraft('')
      composerRef.current?.focus()
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send that message.')
    } finally {
      setSending(false)
    }
  }

  function onComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    void send()
  }

  async function reportUser() {
    if (!active?.other?.id || reporting) return
    setReporting(true)
    try {
      await api.report({
        reported_user_id: active.other.id,
        listing_id: listing?.id ?? null,
        reason: 'Conversation concern',
        details: 'Reported from the messages inbox.',
      })
      notify('Report submitted. Our team will review it.')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to submit that report.')
    } finally {
      setReporting(false)
    }
  }

  async function openAlert(item: Notification) {
    if (!item.read_at) await markNotificationRead(item.id)
    router.push(notificationHref(item))
  }

  return (
    <div data-no-tab-swipe className="mx-auto flex h-[calc(100svh-4rem-4.75rem-env(safe-area-inset-bottom,0px))] w-full max-w-[1280px] flex-col bg-[linear-gradient(180deg,#f9fbfa_0%,#f6faf8_100%)] px-2 pt-2 sm:px-6 sm:pt-3 lg:h-[calc(100svh-72px)] lg:px-8 lg:pt-5">
      <header className={`mb-2 shrink-0 items-end justify-between gap-3 sm:mb-4 ${activeId && panel === 'inbox' ? 'hidden lg:flex' : 'flex'}`}>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Inbox</p>
          <h1 className="mt-1 font-display text-xl font-bold tracking-[-0.035em] text-[#243e39] sm:text-2xl">Messages</h1>
          <p className="mt-1 hidden text-xs text-[#8b9994] sm:block">
            {unreadMessages ? `${unreadMessages} unread message${unreadMessages === 1 ? '' : 's'}` : 'You are caught up on chats'}
            {unreadNotes ? ` · ${unreadNotes} notification${unreadNotes === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <div className="rounded-2xl border border-[#e5eae7] bg-white px-3 py-2 text-right shadow-[0_8px_24px_rgba(36,62,57,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">Chats</p>
            <p className="mt-1 text-sm font-bold text-[#243e39]">{unreadMessages || 0}</p>
          </div>
          <div className="rounded-2xl border border-[#e5eae7] bg-white px-3 py-2 text-right shadow-[0_8px_24px_rgba(36,62,57,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">Alerts</p>
            <p className="mt-1 text-sm font-bold text-[#243e39]">{unreadNotes || 0}</p>
          </div>
        </div>
        <div className="flex shrink-0 rounded-2xl border border-[#e5eae7] bg-white/95 p-1 shadow-[0_8px_24px_rgba(36,62,57,0.05)] xl:hidden">
          <Link
            href={marketPaths.messages}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-[11px] font-bold ${panel === 'inbox' ? 'bg-[#315e55] text-white' : 'text-[#638076]'}`}
          >
            <Inbox size={13} /> Chats
            {unreadInbox > 0 ? <span className="rounded-full bg-white/20 px-1.5">{unreadInbox}</span> : null}
          </Link>
          <Link
            href={marketPaths.messageAlerts}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-[11px] font-bold ${panel === 'alerts' ? 'bg-[#315e55] text-white' : 'text-[#638076]'}`}
          >
            <Bell size={13} /> Notifications
            {unreadNotes > 0 ? <span className="rounded-full bg-[#d1734b] px-1.5 text-white">{unreadNotes}</span> : null}
          </Link>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-2 pb-2 sm:gap-3 sm:pb-3 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_280px]">
        <div className={`h-full min-h-0 ${panel === 'alerts' || activeId ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'}`}>
          <InboxPane
            conversations={filtered}
            total={conversations.length}
            activeId={active?.id}
            query={query}
            filter={filter}
            unreadInbox={unreadInbox}
            onQuery={setQuery}
            onFilter={setFilter}
          />
        </div>

        <div className={`h-full min-h-0 ${panel === 'alerts' ? 'hidden xl:flex xl:flex-col' : activeId ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'}`}>
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_12px_36px_rgba(36,62,57,0.05)] sm:rounded-[26px]">
            {active ? (
              <>
                <ThreadHeader
                  conversation={active}
                  listing={listing}
                  reporting={reporting}
                  onReport={() => void reportUser()}
                />
                <div ref={scrollerRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:px-5">
                  {loadingThread ? (
                    <div className="space-y-3 pt-6">
                      <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-[#eef4f1]" />
                      <div className="ml-auto h-10 w-1/2 animate-pulse rounded-2xl bg-[#e7eeeb]" />
                      <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-[#eef4f1]" />
                    </div>
                  ) : messages.length ? (
                    messages.map((message, index) => {
                      const mine = message.sender_id === profileId
                      const previous = messages[index - 1]
                      const showDay = !previous || !sameDay(previous.created_at, message.created_at)
                      return (
                        <div key={message.id}>
                          {showDay ? (
                            <p className="my-4 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[#9aa7a2]">{dayLabel(message.created_at)}</p>
                          ) : null}
                          <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] rounded-[22px] px-3.5 py-2.5 shadow-[0_6px_16px_rgba(36,62,57,0.04)] sm:max-w-[72%] ${mine ? 'rounded-br-md bg-[#315e55] text-white' : 'rounded-bl-md bg-[#f3f7f5] text-[#243e39]'}`}>
                              <p className="whitespace-pre-wrap text-[13px] leading-6">{message.body}</p>
                              <p className={`mt-1 text-[10px] font-medium ${mine ? 'text-white/65' : 'text-[#8b9994]'}`}>{threadClock(message.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-6 text-center">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-[#fff6f1] text-[#d1734b]"><Sparkles size={20} /></span>
                      <h2 className="mt-4 font-display text-lg font-bold text-[#29463f]">Start the conversation</h2>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-[#748780]">
                        {listing ? `Ask about ${listing.title}. A short, clear first message usually gets a faster reply.` : 'Send a short first message. Be clear about what you need.'}
                      </p>
                      {listing ? (
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                          {SUGGESTIONS.map((item) => (
                            <button key={item} type="button" onClick={() => void send(item)} className="rounded-full border border-[#e5eae7] bg-white px-3 py-1.5 text-[11px] font-bold text-[#526861] hover:border-[#b8d1c9]">
                              {item}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                <form
                  className="shrink-0 border-t border-[#eef3f0] bg-[#fbfcfb]/98 px-3 py-3 backdrop-blur sm:px-4"
                  onSubmit={(event: FormEvent) => {
                    event.preventDefault()
                    void send()
                  }}
                >
                  {error ? <p role="alert" className="mb-2 text-[12px] text-[#b85a38]">{error}</p> : null}
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={composerRef}
                      value={draft}
                      rows={1}
                      maxLength={BODY_MAX}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={onComposerKey}
                      placeholder="Write a message…"
                      className="max-h-28 min-h-12 flex-1 resize-none rounded-2xl border border-[#e5eae7] bg-white px-3.5 py-3 text-sm leading-6 outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
                    />
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-2xl bg-[#315e55] px-4 text-xs font-bold text-white hover:bg-[#274c44] disabled:opacity-50"
                    >
                      <Send size={14} /> {sending ? 'Sending' : 'Send'}
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-[#9aa7a2]">Enter to send · Shift + Enter for a new line · {draft.length}/{BODY_MAX}</p>
                </form>
              </>
            ) : (
              <EmptyThread />
            )}
          </section>
        </div>

        <div className={`h-full min-h-0 ${panel === 'alerts' ? 'flex flex-col' : 'hidden xl:flex xl:flex-col'}`}>
          <AlertsPane
            notifications={visibleNotifications}
            unreadNotes={unreadNotes}
            preferences={notificationPreferences}
            filter={notificationFilter}
            onFilter={setNotificationFilter}
            onOpen={(item) => void openAlert(item)}
            onMarkAll={() => void markNotificationsRead()}
            onSavePreferences={(updates) => void saveNotificationPreferences(updates)}
          />
        </div>
      </div>
    </div>
  )
}

function InboxPane({
  conversations,
  total,
  activeId,
  query,
  filter,
  unreadInbox,
  onQuery,
  onFilter,
}: {
  conversations: Conversation[]
  total: number
  activeId?: string
  query: string
  filter: InboxFilter
  unreadInbox: number
  onQuery: (value: string) => void
  onFilter: (value: InboxFilter) => void
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_12px_36px_rgba(36,62,57,0.05)] sm:rounded-[26px]">
      <div className="shrink-0 border-b border-[#eef3f0] p-3 sm:p-4">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9994]" />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search people or listings"
            className="h-10 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] pl-9 pr-3 text-sm outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
          />
        </div>
        <div className="mt-3 flex gap-1.5">
          {([
            { id: 'all', label: 'All' },
            { id: 'unread', label: unreadInbox ? `Unread (${unreadInbox})` : 'Unread' },
          ] as { id: InboxFilter; label: string }[]).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilter(item.id)}
              className={`h-9 rounded-full px-3 text-[11px] font-bold ${filter === item.id ? 'bg-[#315e55] text-white' : 'border border-[#e5eae7] text-[#638076] hover:bg-[#f7fbf9]'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {conversations.map((item) => {
          const listing = listingOf(item)
          const unread = item.unread_count ?? 0
          const active = item.id === activeId
          return (
            <Link
              key={item.id}
              href={marketPaths.conversation(item.id)}
              className={`mb-1 flex items-start gap-3 rounded-2xl px-3 py-3 transition ${active ? 'bg-[#e7f0ed] shadow-[inset_0_0_0_1px_rgba(49,94,85,0.05)]' : 'hover:bg-[#f6f9f8]'}`}
            >
              <span className="relative shrink-0">
                <Avatar name={item.other?.display_name} color={colorFromSeed(item.other?.id || item.id)} image={item.other?.avatar_url} />
                {unread > 0 ? <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#d1734b] ring-2 ring-white" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={`truncate text-sm ${unread ? 'font-bold text-[#243e39]' : 'font-semibold text-[#29463f]'}`}>{item.other?.display_name ?? 'Conversation'}</span>
                  <span className="shrink-0 text-[10px] text-[#9aa7a2]">{timeAgo(item.updated_at)}</span>
                </span>
                <span className={`mt-0.5 block truncate text-[12px] ${unread ? 'font-medium text-[#526861]' : 'text-[#8b9994]'}`}>{previewOf(item)}</span>
                <span className="mt-1 flex items-center gap-2">
                  {listing ? <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-[#fff6f1] px-2 py-0.5 text-[10px] font-bold text-[#d1734b]"><ShoppingBag size={10} /> {listing.title}</span> : null}
                  {unread > 0 ? <span className="inline-flex rounded-full bg-[#edf6f1] px-2 py-0.5 text-[10px] font-bold text-[#315e55]">New</span> : null}
                </span>
              </span>
              {unread > 1 ? <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#d1734b] px-1.5 text-[10px] font-bold text-white">{unread}</span> : null}
            </Link>
          )
        })}
        {!conversations.length ? (
          <div className="px-4 py-16 text-center">
            <Inbox className="mx-auto text-[#d1734b]" size={22} />
            <p className="mt-3 text-sm font-bold text-[#29463f]">{total ? 'No matches in this filter.' : 'No conversations yet.'}</p>
            <p className="mt-1 text-sm leading-6 text-[#748780]">{total ? 'Try another search or show all chats.' : 'Message a seller from a listing to start one.'}</p>
            {!total ? (
              <Link href={marketPaths.home} className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#315e55] px-4 text-xs font-bold text-white">Browse listings</Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  )
}

function ThreadHeader({
  conversation,
  listing,
  reporting,
  onReport,
}: {
  conversation: Conversation
  listing: NonNullable<Conversation['listing']> | null
  reporting: boolean
  onReport: () => void
}) {
  return (
    <div className="shrink-0 border-b border-[#eef3f0] bg-white/98 px-3 py-3 backdrop-blur sm:px-5">
      <div className="flex items-center gap-3">
        <Link href={marketPaths.messages} className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#e5eae7] text-[#638076] lg:hidden">
          <ArrowLeft size={16} />
        </Link>
        <Avatar name={conversation.other?.display_name} color={colorFromSeed(conversation.other?.id || conversation.id)} image={conversation.other?.avatar_url} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold text-[#243e39]">{conversation.other?.display_name ?? 'Conversation'}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#8b9994]">
            <Clock3 size={11} /> Active {timeAgo(conversation.updated_at)}
          </p>
        </div>
        <button
          type="button"
          onClick={onReport}
          disabled={reporting || !conversation.other?.id}
          className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-[#e5eae7] px-3 text-[11px] font-bold text-[#8b9994] hover:text-[#9a4f32] disabled:opacity-50"
        >
          <Flag size={13} /> <span className="hidden sm:inline">{reporting ? 'Reporting…' : 'Report'}</span>
        </button>
      </div>
      {listing ? (
        <Link href={marketPaths.listing(listing.id)} className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#eef3f0] bg-[#f8fbf9] px-3 py-2.5 transition hover:border-[#c8dbd4]">
          <span className="min-w-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#315e55]"><ShoppingBag size={11} /> {listing.category}</span>
            <span className="mt-0.5 block truncate text-sm font-bold text-[#243e39]">{listing.title}</span>
          </span>
          <span className="shrink-0 text-sm font-bold text-[#d1734b]">{formatUGX(Number(listing.price))}</span>
        </Link>
      ) : null}
      <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-[#8b9994]">
        <Shield size={12} className="mt-0.5 shrink-0 text-[#d1734b]" />
        Keep PINs and passwords off this chat. Meet in a public place and confirm the item before you pay.
      </p>
    </div>
  )
}

function EmptyThread() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-[#eef4f1] text-[#315e55]"><MessageCircle size={24} /></span>
      <h2 className="mt-5 font-display text-xl font-bold text-[#29463f]">Select a conversation</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#748780]">Your chats with buyers and sellers will open here. Notifications from across UniMart are also stored in this inbox.</p>
    </div>
  )
}

function AlertsPane({
  notifications,
  unreadNotes,
  preferences,
  filter,
  onFilter,
  onOpen,
  onMarkAll,
  onSavePreferences,
}: {
  notifications: Notification[]
  unreadNotes: number
  preferences: Notification['id'] extends string ? import('@/lib/types').NotificationPreferences : never
  filter: NotificationFilter
  onFilter: (value: NotificationFilter) => void
  onOpen: (item: Notification) => void
  onMarkAll: () => void
  onSavePreferences: (updates: {
    push_enabled?: boolean
    push_messages?: boolean
    push_sales?: boolean
    push_favorites?: boolean
    push_follows?: boolean
    push_report_updates?: boolean
    push_account_notices?: boolean
  }) => void
}) {
  const unreadItems = notifications.filter((item) => !item.read_at)
  const readItems = notifications.filter((item) => item.read_at)
  const preferencePills = [
    { key: 'push_messages', label: 'Messages' },
    { key: 'push_sales', label: 'Sales' },
    { key: 'push_favorites', label: 'Favorites' },
    { key: 'push_follows', label: 'Follows' },
  ] as const

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_12px_36px_rgba(36,62,57,0.05)] sm:rounded-[26px]">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#eef3f0] px-4 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Inbox</p>
          <h2 className="mt-1 font-display text-lg font-bold text-[#243e39]">Notifications</h2>
          <p className="mt-1 text-[12px] text-[#8b9994]">{unreadNotes ? `${unreadNotes} unread` : 'You are caught up'}</p>
        </div>
        <button type="button" onClick={onMarkAll} disabled={!unreadNotes} className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-[#e5eae7] px-3 text-[11px] font-bold text-[#638076] hover:bg-[#f7fbf9] disabled:cursor-not-allowed disabled:opacity-45">
          <CheckCheck size={14} /> Read all
        </button>
      </div>
      <div className="shrink-0 border-b border-[#eef3f0] px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {([
            { id: 'all', label: 'All' },
            { id: 'unread', label: unreadNotes ? `Unread (${unreadNotes})` : 'Unread' },
            { id: 'messages', label: 'Messages' },
            { id: 'activity', label: 'Activity' },
            { id: 'account', label: 'Account' },
          ] as { id: NotificationFilter; label: string }[]).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilter(item.id)}
              className={`h-9 rounded-full px-3 text-[11px] font-bold ${filter === item.id ? 'bg-[#315e55] text-white' : 'border border-[#e5eae7] text-[#638076] hover:bg-[#f7fbf9]'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="mb-2 rounded-2xl border border-[#eef3f0] bg-[#fbfcfb] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">Preferences</p>
              <p className="mt-1 text-sm font-semibold text-[#243e39]">
                {preferences.push_enabled ? 'Push enabled' : 'Push disabled'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSavePreferences({ push_enabled: !preferences.push_enabled })}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold ${
                preferences.push_enabled
                  ? 'bg-[#315e55] text-white'
                  : 'border border-[#e5eae7] bg-white text-[#638076]'
              }`}
            >
              <Cog size={13} />
              {preferences.push_enabled ? 'On' : 'Off'}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {preferencePills.map((item) => {
              const active = preferences[item.key as keyof typeof preferences] === true
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={!preferences.push_enabled}
                  onClick={() =>
                    onSavePreferences({
                      [item.key]: !active,
                    })
                  }
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    active
                      ? 'bg-[#edf6f1] text-[#315e55]'
                      : 'border border-[#e5eae7] bg-white text-[#8b9994]'
                  } disabled:opacity-45`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {unreadItems.length ? <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9aa7a2]">New</p> : null}
        {unreadItems.map((item) => {
          const Icon = notificationIcon(item.type)
          const unread = !item.read_at
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item)}
              className={`mb-1 flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition ${unread ? 'bg-[#fff8f4] hover:bg-[#fff1e9]' : 'hover:bg-[#f6f9f8]'}`}
            >
              <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${unread ? 'bg-[#f8eee7] text-[#d1734b]' : 'bg-[#eef4f1] text-[#315e55]'}`}>
                <Icon size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className={`block truncate text-sm ${unread ? 'font-bold text-[#243e39]' : 'font-semibold text-[#29463f]'}`}>{item.title}</span>
                    <span className="mt-1 inline-flex rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#8b9994]">
                      {item.type.replace('_', ' ')}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] text-[#9aa7a2]">{timeAgo(item.created_at)}</span>
                </span>
                <span className="mt-1 block line-clamp-2 text-[12px] leading-5 text-[#748780]">{item.body}</span>
              </span>
              {unread ? <span className="mt-2 size-2 shrink-0 rounded-full bg-[#d1734b]" /> : null}
            </button>
          )
        })}
        {readItems.length ? <p className="px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9aa7a2]">Earlier</p> : null}
        {readItems.map((item) => {
          const Icon = notificationIcon(item.type)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item)}
              className="mb-1 flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-[#f6f9f8]"
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef4f1] text-[#315e55]">
                <Icon size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#29463f]">{item.title}</span>
                    <span className="mt-1 inline-flex rounded-full bg-[#f5f8f6] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#8b9994]">
                      {item.type.replace('_', ' ')}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] text-[#9aa7a2]">{timeAgo(item.created_at)}</span>
                </span>
                <span className="mt-1 block line-clamp-2 text-[12px] leading-5 text-[#748780]">{item.body}</span>
              </span>
            </button>
          )
        })}
        {!notifications.length ? (
          <div className="px-4 py-16 text-center">
            <Bell className="mx-auto text-[#d1734b]" size={22} />
            <p className="mt-3 text-sm font-bold text-[#29463f]">No notifications yet.</p>
            <p className="mt-1 text-sm leading-6 text-[#748780]">Messages, listing activity, report updates, and account notices will land here.</p>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
