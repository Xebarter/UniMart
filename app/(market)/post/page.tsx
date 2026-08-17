'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMarket } from '@/components/market/provider'
import { PostComposer } from '@/components/post-composer'
import { marketPaths } from '@/lib/market-paths'

export default function PostPage() {
  const router = useRouter()
  const { profile, loading, requestPost, myShop, addListing } = useMarket()

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') === 'shop') {
      router.replace(marketPaths.shop)
    }
  }, [router])

  useEffect(() => {
    if (loading) return
    if (!profile) requestPost()
  }, [loading, profile, requestPost])

  if (!profile) return null

  return (
    <div className="mx-auto w-full max-w-[1040px] px-3.5 pb-6 pt-3 sm:px-8 sm:pb-8 sm:pt-8 lg:px-10">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d1734b] sm:text-[11px]">Sell on campus</p>
        <h1 className="mt-1 font-display text-[1.4rem] font-bold tracking-[-0.045em] text-[#243e39] sm:mt-2 sm:text-[2.2rem]">New listing</h1>
      </div>
      <div className="mt-3 sm:mt-7">
        <PostComposer
          profile={profile}
          embedded
          onBack={() => router.push(marketPaths.home)}
          onCreated={async (listing) => {
            addListing(listing)
            router.push(marketPaths.listing(listing.id))
          }}
          onSeeLive={(listing) => router.push(marketPaths.listing(listing.id))}
          openShopHref={myShop ? undefined : marketPaths.shop}
        />
      </div>
    </div>
  )
}
