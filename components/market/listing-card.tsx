'use client'

import Link from 'next/link'
import { Heart, MapPin } from 'lucide-react'
import { Avatar } from '@/components/market/avatar'
import { ListingPhoto } from '@/components/listing-photo'
import { colorFromSeed, formatUGX, listingTag } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import type { Listing } from '@/lib/types'

export function ListingCard({ item, saved, toggleSaved }: { item: Listing; saved: boolean; toggleSaved: (id: string) => void }) {
  const seller = item.profiles?.display_name ?? 'Student'
  const href = marketPaths.listing(item.id)
  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-[#e5eae7] bg-white shadow-[0_2px_8px_rgba(38,64,57,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(38,64,57,0.09)]">
      <Link href={href} className="block w-full text-left">
        <div className="relative">
          <ListingPhoto listing={item} alt={item.title} className="aspect-[4/3] w-full" />
          <span className="absolute left-3 top-3 z-[2] rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#52635e] backdrop-blur-sm">{item.category}</span>
        </div>
      </Link>
      <div className="p-3.5 sm:p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <Link href={href} className="min-w-0 text-left">
            <h3 className="truncate text-sm font-bold text-[#29463f] group-hover:text-[#315e55]">{item.title}</h3>
            <p className="mt-1 text-[13px] font-bold text-[#d1734b]">{formatUGX(Number(item.price), item.currency)}</p>
          </Link>
          <button type="button" aria-label={`${saved ? 'Remove' : 'Save'} ${item.title}`} onClick={() => toggleSaved(item.id)} className={`flex size-8 shrink-0 items-center justify-center rounded-full border transition ${saved ? 'border-[#f0c7b3] bg-[#fff5f0] text-[#d1734b]' : 'border-[#e8edeb] text-[#9aa7a2] hover:border-[#d9e5e0] hover:text-[#d1734b]'}`}>
            <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-[#8c9995]"><MapPin size={12} className="shrink-0" /><span className="truncate">{item.location || 'Uganda'}</span></div>
        <div className="mt-3 flex min-w-0 items-center gap-2 border-t border-[#eff2f0] pt-3">
          <Avatar name={seller} color={colorFromSeed(item.owner_id)} small image={item.profiles?.avatar_url} />
          <span className="min-w-0 truncate text-[11px] font-medium text-[#788883]">{seller}</span>
          {listingTag(item) && <span className="ml-auto max-w-[45%] truncate rounded-md bg-[#f1f6f3] px-1.5 py-1 text-[9px] font-semibold text-[#638076]">{listingTag(item)}</span>}
        </div>
      </div>
    </article>
  )
}
