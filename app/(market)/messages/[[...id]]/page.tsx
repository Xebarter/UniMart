'use client'

import { Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { MessagesView } from '@/components/market/messages-view'
import { useMarket } from '@/components/market/provider'
import { loginHref } from '@/lib/auth'

function MessagesPageView() {
  const params = useParams<{ id?: string[] }>()
  const searchParams = useSearchParams()
  const activeId = params.id?.[0]
  const panel = searchParams.get('tab') === 'alerts' ? 'alerts' : 'inbox'
  const { conversations, profile, loading } = useMarket()

  if (loading && !profile) {
    return (
      <div className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-7">
        <div className="h-[min(70vh,640px)] overflow-hidden rounded-[28px] border border-[#dfe7e3] bg-white shadow-[0_28px_80px_rgba(36,62,57,0.08)]">
          <div className="grid h-full gap-0 lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] xl:grid-cols-[minmax(300px,340px)_minmax(0,1fr)_minmax(300px,340px)]">
            <div className="animate-pulse bg-[#f7faf9]" />
            <div className="hidden animate-pulse bg-[#f3f7f5] lg:block" />
            <div className="hidden animate-pulse bg-[#f7faf9] xl:block" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-8 sm:py-16">
        <section className="relative overflow-hidden rounded-[28px] bg-[#315e55] px-6 py-14 text-center text-white shadow-[0_24px_60px_rgba(36,62,57,0.18)] sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rotate-[-18deg] rounded-[44%] border-[22px] border-[#47766b] opacity-60" />
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c7ddd6]">Inbox</p>
          <h1 className="mt-3 font-display text-[1.85rem] font-bold tracking-[-0.04em] sm:text-4xl">Sign in to your messages.</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#d4e4df]">Chats, applications, and alerts in one place.</p>
          <a href={loginHref('/messages')} className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-[#f3c8ad] px-5 text-sm font-bold text-[#315e55] transition hover:bg-white">
            Sign in
          </a>
        </section>
      </div>
    )
  }

  return (
    <MessagesView
      conversations={conversations}
      activeId={activeId}
      panel={panel}
    />
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-7">
        <div className="h-[min(70vh,640px)] animate-pulse rounded-[28px] border border-[#dfe7e3] bg-[#eef3f0]" />
      </div>
    }>
      <MessagesPageView />
    </Suspense>
  )
}
