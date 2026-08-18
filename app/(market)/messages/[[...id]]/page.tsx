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
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-8">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-[#e7eeeb]" />
        <div className="mt-5 grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <div className="h-80 animate-pulse rounded-[24px] bg-[#eef3f0]" />
          <div className="h-80 animate-pulse rounded-[24px] bg-[#eef3f0]" />
          <div className="hidden h-80 animate-pulse rounded-[24px] bg-[#eef3f0] lg:block" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-8 sm:py-16">
        <section className="relative overflow-hidden rounded-[28px] bg-[#315e55] px-6 py-14 text-center text-white sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rotate-[-18deg] rounded-[44%] border-[22px] border-[#47766b] opacity-60" />
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c7ddd6]">Inbox</p>
          <h1 className="mt-3 font-display text-[1.85rem] font-bold tracking-[-0.04em] sm:text-4xl">Sign in to your messages.</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#d4e4df]">Talk with buyers and sellers, get alerts when something needs you, and keep every deal in one thread.</p>
          <a href={loginHref('/messages')} className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-[#f3c8ad] px-5 text-sm font-bold text-[#315e55] hover:bg-white">
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
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-8">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-[#e7eeeb]" />
        <div className="mt-5 h-80 animate-pulse rounded-[24px] bg-[#eef3f0]" />
      </div>
    }>
      <MessagesPageView />
    </Suspense>
  )
}
