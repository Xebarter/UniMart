'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PostComposer } from '@/components/post-composer'
import { useMarket } from '@/components/market/provider'
import { marketPaths } from '@/lib/market-paths'

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { profile, loading, requestPost, myListings, updateMyListing, myShop } = useMarket()
  const listing = myListings.find((item) => item.id === id)
  const back = myShop ? marketPaths.shop : marketPaths.post

  useEffect(() => {
    if (loading) return
    if (!profile) requestPost()
  }, [loading, profile, requestPost])

  useEffect(() => {
    if (loading || !profile || !id) return
    if (!listing || listing.owner_id !== profile.id) router.replace(back)
  }, [back, id, listing, loading, profile, router])

  if (!profile || !listing || listing.owner_id !== profile.id) return null

  return (
    <PostComposer
      key={listing.id}
      listing={listing}
      profile={profile}
      onBack={() => router.push(back)}
      onCreated={async (next) => {
        updateMyListing(next)
        router.push(marketPaths.listing(next.id))
      }}
      onSeeLive={(next) => router.push(marketPaths.listing(next.id))}
    />
  )
}
