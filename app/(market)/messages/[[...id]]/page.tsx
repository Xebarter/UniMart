'use client'

import { useParams } from 'next/navigation'
import { MessagesView } from '@/components/market/messages-view'
import { useMarket } from '@/components/market/provider'
import { loginHref } from '@/lib/auth'

export default function MessagesPage() {
  const params = useParams<{ id?: string[] }>()
  const activeId = params.id?.[0]
  const { conversations, profile, loading, refresh } = useMarket()

  if (!loading && !profile) {
    return (
      <div className="mx-auto max-w-[620px] px-5 py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-[#29463f]">Your messages live here</h1>
        <p className="mt-3 text-sm text-[#81908b]">Sign in to talk with buyers and sellers on campus.</p>
        <a href={loginHref('/messages')} className="mt-6 inline-flex rounded-xl bg-[#315e55] px-4 py-2.5 text-xs font-bold text-white">Sign in</a>
      </div>
    )
  }

  return (
    <MessagesView
      conversations={conversations}
      activeId={activeId}
      profileId={profile?.id}
      onRefresh={refresh}
    />
  )
}
