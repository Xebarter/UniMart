'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Briefcase,
  CheckCheck,
  FileText,
  Flag,
  Heart,
  Inbox,
  MessageCircle,
  Search,
  Send,
  ShoppingBag,
  UserPlus,
} from 'lucide-react'
import { Avatar } from '@/components/market/avatar'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { createClient } from '@/lib/supabase/client'
import { colorFromSeed, timeAgo } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import { formatPhoneDisplay } from '@/lib/phone'
import type { Conversation, GigApplication, Message, Notification } from '@/lib/types'

const BODY_MAX = 4000
const SUGGESTIONS = ['Still available?', 'Can we meet nearby?', 'Best price?']

type InboxFilter = 'all' | 'unread'
type Panel = 'inbox' | 'alerts'

function listingOf(conversation?: Conversation | null) {
  const listing = conversation?.listing as Conversation['listing'] | Conversation['listing'][] | null | undefined
  if (Array.isArray(listing)) return listing[0] ?? null
  return listing ?? null
}

function isApplicationPreview(conversation: Conversation) {
  return conversation.messages?.[0]?.kind === 'gig_application'
}

function previewOf(conversation: Conversation) {
  const last = conversation.messages?.[0]
  const listing = listingOf(conversation)
  if (last?.kind === 'gig_application') {
    return listing?.title ? `Applied for ${listing.title}` : 'Gig application'
  }
  return last?.body?.trim() || 'No messages yet'
}

function threadClock(value: string) {
  const date = new Date(value)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' })
  }
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
  if (type === 'gig_application') return Briefcase
  if (type === 'sale') return ShoppingBag
  if (type === 'favorite') return Heart
  if (type === 'follow') return UserPlus
  return Bell
}

function notificationKind(type: string) {
  if (type === 'gig_application') return 'Application'
  if (type === 'message') return 'Message'
  if (type === 'sale') return 'Sale'
  if (type === 'favorite') return 'Saved'
  if (type === 'follow') return 'Follow'
  return 'Alert'
}

function notificationHref(item: Notification) {
  if (item.path) return item.path
  if (item.conversation_id) return marketPaths.conversation(item.conversation_id)
  if (item.listing_id) return marketPaths.listing(item.listing_id)
  return marketPaths.messages
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
    unreadNotes,
    refresh,
    notify,
    markNotificationsRead,
    markNotificationRead,
  } = useMarket()
  const profileId = profile?.id
  const [messages, setMessages] = useState<Message[]>([])
  const [gigApplication, setGigApplication] = useState<GigApplication | null>(null)
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<InboxFilter>('all')
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
  const chatMessages = messages.filter((item) => item.kind !== 'gig_application')

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
    if (!listing?.id || listing.category !== 'Gigs' || !conversationId) {
      setGigApplication(null)
      return
    }
    let cancelled = false
    api.gigApplications(listing.id)
      .then((result) => {
        if (cancelled) return
        const match = result.data.find((item) => item.conversation_id === conversationId)
        setGigApplication(match ?? (result.mine?.conversation_id === conversationId ? result.mine : null))
      })
      .catch(() => {
        if (!cancelled) setGigApplication(null)
      })
    return () => { cancelled = true }
  }, [conversationId, listing?.category, listing?.id])

  useEffect(() => {
    const node = scrollerRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [chatMessages, gigApplication, conversationId])

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

  useEffect(() => {
    const node = composerRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 112)}px`
  }, [draft])

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
      notify('Report submitted.')
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

  async function openResume(application: GigApplication) {
    if (!listing?.id) return
    try {
      const result = await api.gigResumeUrl(listing.id, application.id)
      window.open(result.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to open this resume.')
    }
  }

  const showInbox = panel === 'alerts' ? false : !activeId
  const showThread = panel !== 'alerts' && Boolean(activeId)
  const showAlerts = panel === 'alerts'

  return (
    <div
      data-no-tab-swipe
      className="relative mx-auto flex h-[calc(100svh-4rem-4.75rem-env(safe-area-inset-bottom,0px))] w-full max-w-[1320px] flex-col px-0 pt-0 sm:px-5 sm:pt-4 lg:h-[calc(100svh-72px)] lg:px-7 lg:pt-5 lg:pb-5"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-48 bg-[radial-gradient(ellipse_at_top,rgba(49,94,85,0.07),transparent_70%)] lg:block" />
      <div className="relative grid min-h-0 flex-1 bg-white lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] lg:overflow-hidden lg:rounded-[28px] lg:border lg:border-[#dfe7e3] lg:shadow-[0_28px_80px_rgba(36,62,57,0.08)] xl:grid-cols-[minmax(300px,340px)_minmax(0,1fr)_minmax(300px,340px)]">
        <div className={`h-full min-h-0 border-[#eef3f0] ${showInbox ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'} lg:border-r`}>
          <InboxPane
            conversations={filtered}
            total={conversations.length}
            activeId={active?.id}
            query={query}
            filter={filter}
            unreadInbox={unreadInbox}
            unreadNotes={unreadNotes}
            onQuery={setQuery}
            onFilter={setFilter}
          />
        </div>

        <div className={`h-full min-h-0 ${showAlerts ? 'hidden xl:flex xl:flex-col' : showThread ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'}`}>
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f6f9f8]">
            {active ? (
              <>
                <ThreadHeader
                  conversation={active}
                  listing={listing}
                  reporting={reporting}
                  onReport={() => void reportUser()}
                />
                <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                  {gigApplication ? (
                    <div className="mb-5">
                      <ApplicationCard application={gigApplication} onResume={() => void openResume(gigApplication)} />
                    </div>
                  ) : null}
                  {loadingThread ? (
                    <div className="space-y-3 pt-2">
                      <div className="h-11 w-2/3 animate-pulse rounded-[22px] bg-white/80" />
                      <div className="ml-auto h-11 w-1/2 animate-pulse rounded-[22px] bg-white" />
                    </div>
                  ) : chatMessages.length ? (
                    chatMessages.map((message, index, thread) => {
                      const mine = message.sender_id === profileId
                      const previous = thread[index - 1]
                      const showDay = !previous || !sameDay(previous.created_at, message.created_at)
                      const grouped = Boolean(previous && previous.sender_id === message.sender_id && !showDay)
                      return (
                        <div key={message.id} className={grouped ? 'mt-1' : 'mt-3.5'}>
                          {showDay ? (
                            <div className="mb-3.5 mt-1 flex justify-center">
                              <span className="rounded-full border border-[#e5eae7] bg-white/90 px-3 py-1 text-[10px] font-semibold tracking-[0.04em] text-[#7d8f88] shadow-[0_1px_2px_rgba(36,62,57,0.04)]">
                                {dayLabel(message.created_at)}
                              </span>
                            </div>
                          ) : null}
                          <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[86%] px-4 py-2.5 sm:max-w-[68%] ${
                                mine
                                  ? 'rounded-[22px] rounded-br-md bg-[#315e55] text-white shadow-[0_8px_20px_rgba(49,94,85,0.18)]'
                                  : 'rounded-[22px] rounded-bl-md border border-[#e7eeeb] bg-white text-[#243e39] shadow-[0_6px_18px_rgba(36,62,57,0.04)]'
                              }`}
                            >
                              <p className="whitespace-pre-wrap text-[13.5px] leading-[1.55]">{message.body}</p>
                              <p className={`mt-1.5 text-[10px] ${mine ? 'text-white/50' : 'text-[#93a29c]'}`}>{threadClock(message.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : !gigApplication ? (
                    <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-6 text-center">
                      <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-[#315e55] shadow-[0_10px_30px_rgba(36,62,57,0.06)]">
                        <MessageCircle size={22} />
                      </span>
                      <p className="mt-4 font-display text-lg font-bold tracking-[-0.03em] text-[#243e39]">Start the conversation</p>
                      {listing && listing.category !== 'Gigs' ? (
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                          {SUGGESTIONS.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => void send(item)}
                              className="rounded-full border border-[#dfe7e3] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#526861] shadow-[0_1px_2px_rgba(36,62,57,0.04)] transition hover:border-[#b8d1c9] hover:text-[#243e39]"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <form
                  className="shrink-0 bg-gradient-to-t from-[#f6f9f8] via-[#f6f9f8] to-transparent px-4 pb-4 pt-1 sm:px-5"
                  onSubmit={(event: FormEvent) => {
                    event.preventDefault()
                    void send()
                  }}
                >
                  {error ? <p role="alert" className="mb-2 px-1 text-[12px] text-[#b85a38]">{error}</p> : null}
                  <div className="flex items-end gap-2 rounded-[22px] border border-[#dfe7e3] bg-white p-2 shadow-[0_10px_30px_rgba(36,62,57,0.06)]">
                    <textarea
                      ref={composerRef}
                      value={draft}
                      rows={1}
                      maxLength={BODY_MAX}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={onComposerKey}
                      placeholder="Write a message"
                      className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-5 outline-none placeholder:text-[#9aa7a2]"
                    />
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      aria-label={sending ? 'Sending' : 'Send'}
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#315e55] text-white transition hover:bg-[#274c44] disabled:bg-[#d7e2de] disabled:text-[#8b9994]"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                  {draft.length > BODY_MAX - 400 ? (
                    <p className="mt-1.5 text-right text-[10px] text-[#9aa7a2]">{draft.length}/{BODY_MAX}</p>
                  ) : null}
                </form>
              </>
            ) : (
              <EmptyThread />
            )}
          </section>
        </div>

        <div className={`h-full min-h-0 border-[#eef3f0] ${showAlerts ? 'flex flex-col' : 'hidden xl:flex xl:flex-col'} xl:border-l`}>
          <AlertsPane
            notifications={notifications}
            unreadNotes={unreadNotes}
            onOpen={(item) => void openAlert(item)}
            onMarkAll={() => void markNotificationsRead()}
          />
        </div>
      </div>
    </div>
  )
}

function iconBtn(active = false) {
  return `flex size-9 shrink-0 items-center justify-center rounded-full transition ${active ? 'bg-[#315e55] text-white' : 'text-[#6a7d76] hover:bg-[#f1f6f3] hover:text-[#243e39]'}`
}

function InboxPane({
  conversations,
  total,
  activeId,
  query,
  filter,
  unreadInbox,
  unreadNotes,
  onQuery,
  onFilter,
}: {
  conversations: Conversation[]
  total: number
  activeId?: string
  query: string
  filter: InboxFilter
  unreadInbox: number
  unreadNotes: number
  onQuery: (value: string) => void
  onFilter: (value: InboxFilter) => void
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <header className="shrink-0 border-b border-[#eef3f0] px-4 pb-3.5 pt-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">Workspace</p>
            <h1 className="mt-1 font-display text-[1.35rem] font-bold tracking-[-0.04em] text-[#243e39]">Inbox</h1>
          </div>
          <div className="flex items-center gap-1">
            <Link href={marketPaths.messageAlerts} aria-label="Notifications" className={`${iconBtn()} relative xl:hidden`}>
              <Bell size={16} />
              {unreadNotes > 0 ? <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#d1734b]" /> : null}
            </Link>
          </div>
        </div>
        <div className="mt-3.5 flex gap-1 rounded-full bg-[#f3f7f5] p-1">
          <FilterChip active={filter === 'all'} onClick={() => onFilter('all')}>All</FilterChip>
          <FilterChip active={filter === 'unread'} onClick={() => onFilter('unread')}>
            Unread{unreadInbox ? ` · ${unreadInbox}` : ''}
          </FilterChip>
        </div>
        <label className="relative mt-3 block">
          <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9994]" />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search"
            className="h-11 w-full rounded-2xl border border-[#e5eae7] bg-[#fbfcfb] pl-10 pr-3 text-[13px] outline-none transition placeholder:text-[#9aa7a2] focus:border-[#86aa9e] focus:bg-white"
          />
        </label>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {conversations.map((item) => {
          const unread = item.unread_count ?? 0
          const selected = item.id === activeId
          const application = isApplicationPreview(item)
          return (
            <Link
              key={item.id}
              href={marketPaths.conversation(item.id)}
              className={`flex items-center gap-3 rounded-[18px] px-2.5 py-2.5 transition ${
                selected
                  ? 'bg-[#edf4f1] shadow-[inset_0_0_0_1px_rgba(49,94,85,0.08)]'
                  : 'hover:bg-[#f7faf9]'
              }`}
            >
              <span className="relative shrink-0">
                <Avatar name={item.other?.display_name} color={colorFromSeed(item.other?.id || item.id)} image={item.other?.avatar_url} />
                {unread > 0 ? <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#d1734b] ring-2 ring-white" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`truncate text-[13.5px] ${unread || selected ? 'font-bold text-[#243e39]' : 'font-semibold text-[#2f4a43]'}`}>
                    {item.other?.display_name ?? 'Chat'}
                  </span>
                  <span className={`shrink-0 text-[10px] ${unread ? 'font-semibold text-[#d1734b]' : 'text-[#9aa7a2]'}`}>{timeAgo(item.updated_at)}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1.5">
                  {application ? (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#315e55]">Applied</span>
                  ) : null}
                  <span className={`min-w-0 truncate text-[12px] leading-4 ${unread ? 'text-[#526861]' : 'text-[#8b9994]'}`}>
                    {previewOf(item)}
                  </span>
                </span>
              </span>
              {unread > 1 ? (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#d1734b] px-1.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </Link>
          )
        })}
        {!conversations.length ? (
          <EmptyPane
            icon={<Inbox size={20} />}
            title={total ? 'No unread chats' : 'No chats yet'}
            action={total ? (
              <button type="button" onClick={() => onFilter('all')} className="mt-3 text-xs font-bold text-[#315e55]">
                Show all
              </button>
            ) : (
              <Link href={marketPaths.home} className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#315e55] px-4 text-xs font-bold text-white">
                Browse
              </Link>
            )}
          />
        ) : null}
      </div>
    </aside>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 flex-1 rounded-full text-[12px] font-bold transition ${
        active ? 'bg-white text-[#243e39] shadow-[0_1px_4px_rgba(36,62,57,0.08)]' : 'text-[#6a7d76] hover:text-[#243e39]'
      }`}
    >
      {children}
    </button>
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
    <header className="flex shrink-0 items-center gap-3 border-b border-[#e5eae7]/80 bg-white/80 px-4 py-3.5 backdrop-blur-md sm:px-5">
      <Link href={marketPaths.messages} aria-label="Back to chats" className={`${iconBtn()} lg:hidden`}>
        <ArrowLeft size={16} />
      </Link>
      <Avatar
        name={conversation.other?.display_name}
        color={colorFromSeed(conversation.other?.id || conversation.id)}
        image={conversation.other?.avatar_url}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[15px] font-bold tracking-[-0.02em] text-[#243e39]">
          {conversation.other?.display_name ?? 'Chat'}
        </p>
        {listing ? (
          <Link
            href={marketPaths.listing(listing.id)}
            className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-[#edf4f0] px-2 py-0.5 text-[10px] font-bold text-[#315e55] transition hover:bg-[#e3eee9]"
          >
            <span className="truncate">{listing.category === 'Gigs' ? 'Gig' : listing.category} · {listing.title}</span>
            <ArrowUpRight size={11} className="shrink-0" />
          </Link>
        ) : (
          <p className="mt-0.5 text-[11px] font-medium text-[#8b9994]">Direct message</p>
        )}
      </div>
      <button
        type="button"
        onClick={onReport}
        disabled={reporting || !conversation.other?.id}
        aria-label={reporting ? 'Reporting' : 'Report'}
        className={`${iconBtn()} hover:text-[#9a4f32] disabled:opacity-40`}
      >
        <Flag size={15} />
      </button>
    </header>
  )
}

function ApplicationCard({
  application,
  onResume,
}: {
  application: GigApplication
  onResume: () => void
}) {
  const campus = [application.university || application.profiles?.university, application.campus || application.profiles?.campus].filter(Boolean).join(' · ')
  return (
    <article className="overflow-hidden rounded-[22px] border border-[#e5eae7] bg-white shadow-[0_10px_28px_rgba(36,62,57,0.05)]">
      <div className="flex items-start gap-3 px-4 py-4">
        <Avatar
          name={application.profiles?.display_name || application.name}
          color={colorFromSeed(application.applicant_id)}
          image={application.profiles?.avatar_url}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Application</p>
          <p className="mt-0.5 font-display text-[15px] font-bold tracking-[-0.02em] text-[#243e39]">
            {application.profiles?.display_name || application.name}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-[#748780]">
            {[campus || 'Student', application.student_number].filter(Boolean).join(' · ')}
          </p>
          {application.phone ? (
            <p className="mt-0.5 text-[12px] font-semibold text-[#526861]">{formatPhoneDisplay(application.phone)}</p>
          ) : null}
        </div>
      </div>
      {application.cover_letter ? (
        <p className="border-t border-[#eef3f0] px-4 py-3 text-[13px] leading-6 text-[#5f746c]">{application.cover_letter}</p>
      ) : null}
      <div className="border-t border-[#eef3f0] px-4 py-3">
        <button
          type="button"
          onClick={onResume}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#315e55] px-3.5 text-[12px] font-bold text-white transition hover:bg-[#274c44]"
        >
          <FileText size={13} /> Resume
        </button>
      </div>
    </article>
  )
}

function EmptyThread() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-[22px] bg-white text-[#315e55] shadow-[0_16px_40px_rgba(36,62,57,0.08)]">
        <MessageCircle size={24} />
      </span>
      <p className="mt-5 font-display text-xl font-bold tracking-[-0.04em] text-[#243e39]">Select a conversation</p>
      <p className="mt-1.5 max-w-[16rem] text-sm leading-6 text-[#748780]">Inbox on the left. Replies in the middle. Alerts stay on the right.</p>
    </div>
  )
}

function EmptyPane({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="px-5 py-16 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#f3f7f5] text-[#315e55]">
        {icon}
      </span>
      <p className="mt-4 font-display text-base font-bold tracking-[-0.02em] text-[#29463f]">{title}</p>
      {hint ? <p className="mt-1 text-sm text-[#748780]">{hint}</p> : null}
      {action}
    </div>
  )
}

function AlertsPane({
  notifications,
  unreadNotes,
  onOpen,
  onMarkAll,
}: {
  notifications: Notification[]
  unreadNotes: number
  onOpen: (item: Notification) => void
  onMarkAll: () => void
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <header className="shrink-0 border-b border-[#eef3f0] px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <Link href={marketPaths.messages} aria-label="Back to chats" className={`${iconBtn()} mt-0.5 xl:hidden`}>
              <ArrowLeft size={16} />
            </Link>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">Activity</p>
              <h2 className="mt-1 font-display text-[1.35rem] font-bold tracking-[-0.04em] text-[#243e39]">Alerts</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onMarkAll}
            disabled={!unreadNotes}
            className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold text-[#315e55] transition hover:bg-[#f1f6f3] disabled:opacity-35"
          >
            <CheckCheck size={14} />
            Read
          </button>
        </div>
        <p className="mt-2 text-[12px] text-[#8b9994]">{unreadNotes ? `${unreadNotes} new` : 'You are up to date'}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {notifications.map((item) => {
          const Icon = notificationIcon(item.type)
          const unread = !item.read_at
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item)}
              className={`mb-1 flex w-full items-start gap-3 rounded-[18px] px-2.5 py-3 text-left transition ${
                unread ? 'bg-[#fff8f4]' : 'hover:bg-[#f7faf9]'
              }`}
            >
              <span className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl ${unread ? 'bg-[#f8eee7] text-[#d1734b]' : 'bg-[#f3f7f5] text-[#315e55]'}`}>
                <Icon size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa7a2]">{notificationKind(item.type)}</span>
                  <span className="shrink-0 text-[10px] text-[#9aa7a2]">{timeAgo(item.created_at)}</span>
                </span>
                <span className={`mt-0.5 block truncate text-[13px] ${unread ? 'font-bold text-[#243e39]' : 'font-semibold text-[#29463f]'}`}>{item.title}</span>
                <span className="mt-0.5 block line-clamp-2 text-[12px] leading-5 text-[#748780]">{item.body}</span>
              </span>
              {unread ? <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#d1734b]" /> : null}
            </button>
          )
        })}
        {!notifications.length ? (
          <EmptyPane icon={<Bell size={20} />} title="No alerts" hint="New activity will land here." />
        ) : null}
      </div>
    </aside>
  )
}
