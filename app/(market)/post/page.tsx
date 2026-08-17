'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PostComposer } from '@/components/post-composer'
import { useMarket } from '@/components/market/provider'
import { marketPaths } from '@/lib/market-paths'

export default function PostPage() {
  const router = useRouter()
  const { profile, loading, requestPost, addListing } = useMarket()

  useEffect(() => {
    if (loading) return
    if (!profile) requestPost()
  }, [loading, profile, requestPost])

  if (!profile) return null

  return (
    <PostComposer
      profile={profile}
      onBack={() => router.push(marketPaths.home)}
      onCreated={async (listing) => { addListing(listing) }}
      onSeeLive={(listing) => router.push(marketPaths.listing(listing.id))}
    />
  )
}
