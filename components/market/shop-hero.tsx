import type { ReactNode } from 'react'
import { CheckCircle2, MapPin } from 'lucide-react'
import { Avatar } from '@/components/market/avatar'
import { ShopCover } from '@/components/market/shop-cover'
import { colorFromSeed } from '@/lib/format'
import type { Profile, Shop } from '@/lib/types'

export function ShopHero({
  shop,
  owner,
  followerCount,
  listingCount,
  actions,
}: {
  shop: Shop
  owner?: Pick<Profile, 'id' | 'display_name' | 'university' | 'campus' | 'avatar_url' | 'verified'> | null
  followerCount?: number
  listingCount: number
  actions?: ReactNode
}) {
  const person = owner ?? shop.profiles
  return (
    <section className="overflow-hidden rounded-[22px] border border-[#e5eae7] bg-white shadow-[0_12px_40px_rgba(36,62,57,0.05)] sm:rounded-[28px]">
      <ShopCover shop={shop} className="h-28 sm:h-44" />
      <div className="px-4 pb-5 sm:px-8 sm:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
          <div className="flex min-w-0 items-end gap-3 sm:gap-4">
            <span className="relative -mt-10 shrink-0 rounded-full bg-white p-1 shadow-[0_8px_24px_rgba(36,62,57,0.12)] sm:-mt-12">
              <Avatar name={person?.display_name || shop.name} color={colorFromSeed(shop.owner_id)} image={person?.avatar_url} size="xl" />
            </span>
            <div className="min-w-0 flex-1 pb-0.5 sm:pb-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d1734b] sm:text-[11px]">Shop</p>
              <h1 className="mt-1 truncate font-display text-[1.4rem] font-bold tracking-[-0.04em] text-[#243e39] sm:text-[2rem]">{shop.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[#748780] sm:mt-1.5 sm:text-sm">
                {person?.display_name && <span className="truncate">{person.display_name}</span>}
                {(person?.campus || person?.university) && (
                  <span className="inline-flex min-w-0 items-center gap-1"><MapPin size={13} className="shrink-0" /><span className="truncate">{person.campus || person.university}</span></span>
                )}
                {person?.verified && (
                  <span className="inline-flex items-center gap-1 text-[#4e786a]"><CheckCircle2 size={13} /> Verified</span>
                )}
              </p>
            </div>
          </div>
          {actions && (
            <div className="flex w-full gap-2 sm:w-auto sm:justify-end [&>*]:min-h-10 [&>*]:flex-1 [&>*]:justify-center sm:[&>*]:flex-none">
              {actions}
            </div>
          )}
        </div>
        {shop.bio && <p className="mt-4 line-clamp-3 max-w-2xl text-[13px] leading-6 text-[#5f746c] sm:mt-5 sm:line-clamp-none sm:text-sm">{shop.bio}</p>}
        <p className="mt-3 text-[12px] text-[#8b9994] sm:mt-4">
          {typeof followerCount === 'number' ? `${followerCount} follower${followerCount === 1 ? '' : 's'} · ` : ''}
          {listingCount} live listing{listingCount === 1 ? '' : 's'}
        </p>
      </div>
    </section>
  )
}
