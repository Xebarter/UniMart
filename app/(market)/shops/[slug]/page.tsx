'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Store, UserMinus, UserPlus } from 'lucide-react'
import { ListingCard } from '@/components/market/listing-card'
import { ShopHero } from '@/components/market/shop-hero'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { loginHref } from '@/lib/auth'
import { marketPaths } from '@/lib/market-paths'
import { rankListings } from '@/lib/search'
import type { Listing, Shop } from '@/lib/types'

export default function PublicShopPage() {
  const { slug } = useParams<{ slug: string }>()
  const { profile, saved, toggleSaved, notify } = useMarket()
  const [shop, setShop] = useState<Shop | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [followerCount, setFollowerCount] = useState(0)
  const [following, setFollowing] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isOwner = Boolean(profile && shop && profile.id === shop.owner_id)
  const ranked = useMemo(() => rankListings(listings, ''), [listings])

  useEffect(() => {
    if (!slug) return
    api.shopBySlug(slug)
      .then((result) => {
        setShop(result.data)
        setListings(result.listings)
        setFollowerCount(result.follower_count)
        setFollowing(result.following)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Shop not found.'))
  }, [slug])

  async function toggleFollow() {
    if (!shop) return
    if (!profile) {
      window.location.href = loginHref(marketPaths.shopPublic(shop.slug))
      return
    }
    setBusy(true)
    try {
      if (following) {
        await api.unfollow(shop.owner_id)
        setFollowing(false)
        setFollowerCount((count) => Math.max(0, count - 1))
        notify('Unfollowed')
      } else {
        await api.follow(shop.owner_id)
        setFollowing(true)
        setFollowerCount((count) => count + 1)
        notify(`Following ${shop.name}`)
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update follow')
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return <div className="px-5 py-20 text-center text-sm text-[#81908b]">{error}</div>
  }
  if (!shop) {
    return <div className="px-5 py-20 text-center text-sm text-[#81908b]">Loading shop…</div>
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 pb-10 pt-5 sm:px-8 sm:pt-8 lg:px-10">
      <ShopHero
        shop={shop}
        owner={shop.profiles}
        followerCount={followerCount}
        listingCount={listings.length}
        actions={
          isOwner ? (
            <Link href={marketPaths.shop} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#315e55] px-3.5 text-xs font-bold text-white hover:bg-[#274c44]">
              <Store size={14} /> Manage shop
            </Link>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => { void toggleFollow() }}
              className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold ${
                following
                  ? 'border border-[#dfe7e3] text-[#526861] hover:bg-[#f6f9f8]'
                  : 'bg-[#315e55] text-white hover:bg-[#274c44]'
              }`}
            >
              {following ? <UserMinus size={14} /> : <UserPlus size={14} />}
              {following ? 'Following' : 'Follow'}
            </button>
          )
        }
      />

      <h2 className="mt-8 font-display text-xl font-bold text-[#29463f]">In this shop</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map((item) => (
          <ListingCard key={item.id} item={item} saved={saved.includes(item.id)} toggleSaved={toggleSaved} hideSeller />
        ))}
      </div>
      {!listings.length && (
        <p className="mt-6 rounded-[24px] border border-dashed border-[#d5e4de] bg-[#f7fbf9] px-6 py-10 text-center text-sm leading-6 text-[#748780]">
          {isOwner
            ? 'Add listings from your shop hub to show products here.'
            : 'This shop has not listed any products yet. Follow to get notified when they do.'}
        </p>
      )}
    </div>
  )
}
