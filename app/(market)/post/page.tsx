'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMarket } from '@/components/market/provider'
import { PostComposer } from '@/components/post-composer'
import { marketPaths } from '@/lib/market-paths'

function PostPageView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile, loading, requestPost, myShop, addListing, updateMyListing } = useMarket()
  const forShop = searchParams.get('tab') === 'shop'

  useEffect(() => {
    if (loading) return
    if (!profile) requestPost()
  }, [loading, profile, requestPost])

  useEffect(() => {
    if (loading || !profile || !forShop) return
    if (!myShop) router.replace(marketPaths.shop)
  }, [forShop, loading, myShop, profile, router])

  if (!profile) return null
  if (forShop && !myShop) return null

  const backTo = forShop ? marketPaths.shop : marketPaths.home

  return (
    <div className="mx-auto w-full max-w-[1040px] px-3.5 pb-6 pt-3 sm:px-8 sm:pb-8 sm:pt-8 lg:px-10">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d1734b] sm:text-[11px]">
          {forShop ? 'Shop / New item' : 'Sell on campus'}
        </p>
        <h1 className="mt-1 font-display text-[1.4rem] font-bold tracking-[-0.045em] text-[#243e39] sm:mt-2 sm:text-[2.2rem]">
          {forShop ? 'List shop items' : 'New listing'}
        </h1>
        {forShop ? (
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#748780]">
            New posts go live on campus and appear in {myShop?.name ?? 'your shop'} right away.
          </p>
        ) : null}
      </div>
      <div className="mt-3 sm:mt-7">
        <PostComposer
          profile={profile}
          embedded
          shopId={forShop ? myShop?.id : undefined}
          shopLiveNote={forShop ? `This listing will be added to ${myShop?.name}.` : undefined}
          onBack={() => router.push(backTo)}
          onCreated={async (listing) => {
            addListing(listing)
            updateMyListing(listing)
            router.push(forShop ? marketPaths.shop : marketPaths.listing(listing.id))
          }}
          onSeeLive={(listing) => router.push(forShop ? marketPaths.shop : marketPaths.listing(listing.id))}
          openShopHref={myShop || forShop ? undefined : marketPaths.shop}
        />
      </div>
    </div>
  )
}

export default function PostPage() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-center text-sm text-[#81908b]">Loading…</p>}>
      <PostPageView />
    </Suspense>
  )
}
