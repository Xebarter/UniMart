'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { marketPaths } from '@/lib/market-paths'
import type { Conversation, Message } from '@/lib/types'

export function MessagesView({
  conversations,
  activeId,
  profileId,
  onRefresh,
}: {
  conversations: Conversation[]
  activeId?: string
  profileId?: string
  onRefresh: () => Promise<void>
}) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const active = conversations.find((item) => item.id === activeId) ?? conversations[0]
  const conversationId = active?.id

  useEffect(() => {
    if (!conversationId) return
    if (!activeId) {
      router.replace(marketPaths.conversation(conversationId))
      return
    }
    api.messages(conversationId).then((result) => setMessages(result.data)).catch(() => setMessages([]))
    api.markRead(conversationId).catch(() => undefined)
  }, [conversationId, activeId, router])

  if (!conversations.length) {
    return <div className="mx-auto max-w-[720px] px-5 py-20 text-center text-sm text-[#81908b]">No conversations yet. Message a seller from a listing to start one.</div>
  }

  return (
    <div className="mx-auto grid max-w-[980px] gap-4 px-5 py-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border border-[#e5eae7] bg-white p-3">
        {conversations.map((item) => (
          <Link key={item.id} href={marketPaths.conversation(item.id)} className={`mb-1 block w-full rounded-xl px-3 py-3 text-left ${item.id === active?.id ? 'bg-[#e7f0ed]' : 'hover:bg-[#f4f7f5]'}`}>
            <p className="text-xs font-bold text-[#29463f]">{item.other?.display_name ?? 'Conversation'}</p>
            <p className="mt-1 truncate text-[11px] text-[#8b9994]">{item.messages?.[0]?.body ?? 'No messages yet'}</p>
          </Link>
        ))}
      </aside>
      <section className="flex min-h-[420px] flex-col rounded-2xl border border-[#e5eae7] bg-white p-4">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {messages.map((message) => (
            <div key={message.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${message.sender_id === profileId ? 'ml-auto bg-[#315e55] text-white' : 'bg-[#f1f5f3] text-[#29463f]'}`}>{message.body}</div>
          ))}
        </div>
        <form
          className="mt-4 flex gap-2"
          onSubmit={async (event) => {
            event.preventDefault()
            if (!active || !draft.trim()) return
            const result = await api.sendMessage({ conversation_id: active.id, body: draft.trim() })
            setMessages((current) => [...current, result.data])
            setDraft('')
            await onRefresh()
          }}
        >
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message" className="h-11 flex-1 rounded-xl border border-[#e5eae7] px-3 text-sm" />
          <button className="rounded-xl bg-[#315e55] px-4 text-xs font-bold text-white">Send</button>
        </form>
      </section>
    </div>
  )
}
