'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Store, UserMinus, UserPlus } from 'lucide-react'
import { Avatar } from '@/components/market/avatar'
import { ShopCover } from '@/components/market/shop-cover'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { loginHref } from '@/lib/auth'
import { colorFromSeed } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import type { Shop } from '@/lib/types'

export function ShopCard({
  shop,
  compact = false,
  following: followingProp,
  onFollowChange,
}: {
  shop: Shop
  compact?: boolean
  following?: boolean
  onFollowChange?: (following: boolean, followerDelta: number) => void
}) {
  const { profile, notify } = useMarket()
  const owner = shop.profiles
  const [following, setFollowing] = useState(followingProp ?? shop.following ?? false)
  const [followerCount, setFollowerCount] = useState(shop.follower_count ?? 0)
  const [busy, setBusy] = useState(false)
  const isOwner = Boolean(profile && profile.id === shop.owner_id)
  const campus = [owner?.campus, owner?.university].filter(Boolean).join(' · ')
  const listingCount = shop.listing_count ?? 0

  async function toggleFollow(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (isOwner) return
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
        onFollowChange?.(false, -1)
        notify('Unfollowed')
      } else {
        await api.follow(shop.owner_id)
        setFollowing(true)
        setFollowerCount((count) => count + 1)
        onFollowChange?.(true, 1)
        notify(`Following ${shop.name}`)
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update follow')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={`group overflow-hidden rounded-2xl border border-[#e5eae7] bg-white transition hover:border-[#c8dbd4] hover:shadow-[0_12px_32px_rgba(36,62,57,0.08)] ${compact ? '' : 'sm:rounded-[22px]'}`}>
      <Link href={marketPaths.shopPublic(shop.slug)} className="block">
        <ShopCover shop={shop} className={compact ? 'h-24' : 'h-28 sm:h-32'} />
        <div className={compact ? 'px-3 pb-3 pt-2.5' : 'px-4 pb-4 pt-3 sm:px-5 sm:pb-5'}>
          <div className="flex items-start gap-2.5">
            <span className={`-mt-7 shrink-0 rounded-full bg-white p-0.5 shadow-[0_4px_12px_rgba(36,62,57,0.1)] ${compact ? '-mt-6' : 'sm:-mt-8'}`}>
              <Avatar
                name={owner?.display_name || shop.name}
                color={colorFromSeed(shop.owner_id)}
                image={owner?.avatar_url}
                small={compact}
              />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="truncate font-display text-sm font-bold text-[#243e39] sm:text-[15px]">{shop.name}</p>
              {campus ? (
                <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-[#8b9994] sm:text-[11px]">
                  <MapPin size={11} className="shrink-0" />
                  <span className="truncate">{campus}</span>
                </p>
              ) : null}
            </div>
          </div>
          {shop.bio && !compact ? (
            <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#748780] sm:text-xs">{shop.bio}</p>
          ) : null}
          <p className="mt-2 text-[10px] font-medium text-[#8b9994] sm:text-[11px]">
            {listingCount} listing{listingCount === 1 ? '' : 's'}
            {typeof followerCount === 'number' ? ` · ${followerCount} follower${followerCount === 1 ? '' : 's'}` : ''}
          </p>
        </div>
      </Link>
      {!isOwner ? (
        <div className={`border-t border-[#eef3f0] px-3 py-2.5 sm:px-4 ${compact ? 'px-3' : ''}`}>
          <button
            type="button"
            disabled={busy}
            onClick={toggleFollow}
            className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition disabled:opacity-60 ${
              following
                ? 'border border-[#dfe7e3] bg-white text-[#526861] hover:bg-[#f6f9f8]'
                : 'bg-[#315e55] text-white hover:bg-[#294f48]'
            }`}
          >
            {following ? <UserMinus size={14} /> : <UserPlus size={14} />}
            {following ? 'Following' : 'Follow shop'}
          </button>
        </div>
      ) : (
        <div className={`border-t border-[#eef3f0] px-3 py-2.5 sm:px-4 ${compact ? 'px-3' : ''}`}>
          <Link
            href={marketPaths.shop}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-[#dfe7e3] bg-white text-xs font-bold text-[#526861] hover:bg-[#f6f9f8]"
          >
            <Store size={14} />
            Manage shop
          </Link>
        </div>
      )}
    </article>
  )
}
