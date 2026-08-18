'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Heart, MapPin, X } from 'lucide-react'
import { Avatar } from '@/components/market/avatar'
import { ListingPhoto } from '@/components/listing-photo'
import { ListingShareButton } from '@/components/market/listing-share'
import { colorFromSeed, formatUGX, listingTag, rentPeriodSuffix } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import type { Listing } from '@/lib/types'

function RemoveButton({
  onRemove,
  removeLabel,
  removeBusy,
  className,
}: {
  onRemove: () => void
  removeLabel?: string
  removeBusy?: boolean
  className: string
}) {
  return (
    <button
      type="button"
      aria-label={removeLabel ?? 'Remove'}
      disabled={removeBusy}
      onClick={onRemove}
      className={className}
    >
      <X size={14} strokeWidth={2.2} />
    </button>
  )
}

export function ListingCard({
  item,
  saved,
  toggleSaved,
  hideSave = false,
  hideSeller = false,
  manageHref,
  footer,
  onRemove,
  removeLabel,
  removeBusy = false,
  row = false,
  compact = false,
}: {
  item: Listing
  saved: boolean
  toggleSaved: (id: string) => void
  hideSave?: boolean
  hideSeller?: boolean
  manageHref?: string
  footer?: ReactNode
  onRemove?: () => void
  removeLabel?: string
  removeBusy?: boolean
  row?: boolean
  compact?: boolean
}) {
  const seller = item.profiles?.display_name ?? 'Seller'
  const href = marketPaths.listing(item.id)
  const saveControl = hideSave ? null : (
    <button
      type="button"
      aria-label={`${saved ? 'Remove' : 'Save'} ${item.title}`}
      onClick={() => toggleSaved(item.id)}
      className={`flex shrink-0 items-center justify-center rounded-full border transition ${
        compact
          ? `size-7 ${saved ? 'border-[#f0c7b3] bg-[#fff5f0] text-[#d1734b]' : 'border-white/80 bg-white/95 text-[#7a8c86] shadow-[0_4px_12px_rgba(36,62,57,0.12)] hover:text-[#d1734b]'}`
          : `size-8 ${saved ? 'border-[#f0c7b3] bg-[#fff5f0] text-[#d1734b]' : 'border-[#e8edeb] text-[#9aa7a2] hover:border-[#d9e5e0] hover:text-[#d1734b]'}`
      }`}
    >
      <Heart size={compact ? 13 : 15} fill={saved ? 'currentColor' : 'none'} />
    </button>
  )
  const details = (
    <>
      <div className={`flex min-w-0 items-start justify-between ${compact ? 'mb-1 gap-1.5' : 'mb-2 gap-3'}`}>
        <Link href={href} className="min-w-0 flex-1 text-left">
          <h3 className={`font-bold text-[#29463f] group-hover:text-[#315e55] ${compact ? 'line-clamp-2 text-[13px] leading-4' : 'truncate text-sm'}`}>{item.title}</h3>
          <p className={`truncate font-bold text-[#d1734b] ${compact ? 'mt-1 text-xs' : 'mt-1 text-[13px]'}`}>
            {formatUGX(Number(item.price), item.currency)}
            {item.category === 'Rentals' && rentPeriodSuffix(item.rent_period) && (
              <span className="font-semibold text-[#9aa7a2]"> {rentPeriodSuffix(item.rent_period)}</span>
            )}
          </p>
        </Link>
        {!compact && saveControl}
      </div>
      <div className={`min-w-0 items-center text-[#8c9995] ${compact ? 'mt-1 flex gap-1 text-[10px]' : `gap-1.5 text-[11px] ${row ? 'hidden sm:flex' : 'flex'}`}`}>
        <MapPin size={compact ? 10 : 12} className="shrink-0" /><span className="truncate">{item.location || 'Uganda'}</span>
      </div>
      {hideSeller || compact ? null : (
        <div className="mt-3 flex min-w-0 items-center gap-2 border-t border-[#eff2f0] pt-3">
          <Avatar name={seller} color={colorFromSeed(item.owner_id)} small image={item.profiles?.avatar_url} />
          <span className="min-w-0 truncate text-[11px] font-medium text-[#788883]">{seller}</span>
          {listingTag(item) && <span className="ml-auto max-w-[45%] truncate rounded-md bg-[#f1f6f3] px-1.5 py-1 text-[9px] font-semibold text-[#638076]">{listingTag(item)}</span>}
        </div>
      )}
      {manageHref && (
        <Link href={manageHref} className="mt-3 inline-flex text-[11px] font-bold text-[#315e55] hover:underline">
          Edit listing
        </Link>
      )}
    </>
  )

  if (row) {
    return (
      <article className="group min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-[#e5eae7] bg-white shadow-[0_2px_8px_rgba(38,64,57,0.03)] sm:transition sm:hover:-translate-y-0.5 sm:hover:shadow-[0_10px_24px_rgba(38,64,57,0.09)]">
        <div className="flex items-center sm:block">
          <div className="relative size-[6.5rem] shrink-0 sm:h-auto sm:w-full sm:size-auto">
            <Link href={href} className="block size-full text-left sm:h-auto">
              <ListingPhoto listing={item} alt={item.title} className="size-full sm:aspect-[4/3] sm:h-auto sm:w-full" />
              <span className="absolute left-3 top-3 z-[2] hidden rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#52635e] backdrop-blur-sm sm:inline">{item.category}</span>
            </Link>
            {onRemove && (
              <RemoveButton
                onRemove={onRemove}
                removeLabel={removeLabel}
                removeBusy={removeBusy}
                className="absolute right-2.5 top-2.5 z-[3] hidden size-8 items-center justify-center rounded-full bg-white/95 text-[#5a6f69] shadow-[0_6px_18px_rgba(36,62,57,0.14)] backdrop-blur-sm transition hover:bg-white hover:text-[#b85a38] disabled:opacity-50 sm:flex"
              />
            )}
          </div>
          <div className="min-w-0 flex-1 px-3 py-2.5 sm:p-4">
            {details}
            <div className="hidden sm:block">{footer}</div>
          </div>
          {onRemove && (
            <RemoveButton
              onRemove={onRemove}
              removeLabel={removeLabel}
              removeBusy={removeBusy}
              className="mr-2.5 flex size-9 shrink-0 items-center justify-center rounded-full text-[#7a8c86] transition hover:bg-[#f4f7f6] hover:text-[#b85a38] disabled:opacity-50 sm:hidden"
            />
          )}
        </div>
        {footer && (
          <div className="border-t border-[#eef3f0] px-2.5 py-2 sm:hidden">{footer}</div>
        )}
      </article>
    )
  }

  return (
    <article className={`group min-w-0 overflow-hidden border border-[#e5eae7] bg-white shadow-[0_2px_8px_rgba(38,64,57,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(38,64,57,0.09)] ${compact ? 'rounded-xl sm:rounded-2xl' : 'rounded-2xl'}`}>
      <div className="relative">
        <Link href={href} className="block w-full text-left">
          <ListingPhoto listing={item} alt={item.title} className={`${compact ? 'aspect-square sm:aspect-[4/3]' : 'aspect-[4/3]'} w-full`} />
          <span className={`absolute z-[2] rounded-full bg-white/90 font-bold text-[#52635e] backdrop-blur-sm ${compact ? 'left-2 top-2 px-1.5 py-0.5 text-[9px] sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]' : 'left-3 top-3 px-2.5 py-1 text-[10px]'}`}>{item.category}</span>
        </Link>
        {compact && saveControl ? (
          <div className="absolute right-2 top-2 z-[3] sm:right-2.5 sm:top-2.5">{saveControl}</div>
        ) : null}
        <div className={`absolute z-[3] ${compact ? 'bottom-2 right-2 sm:bottom-2.5 sm:right-2.5' : 'bottom-2.5 right-2.5'}`}>
          <ListingShareButton listing={item} compact={compact} />
        </div>
        {onRemove && (
          <RemoveButton
            onRemove={onRemove}
            removeLabel={removeLabel}
            removeBusy={removeBusy}
            className="absolute right-2.5 top-2.5 z-[3] flex size-8 items-center justify-center rounded-full bg-white/95 text-[#5a6f69] shadow-[0_6px_18px_rgba(36,62,57,0.14)] backdrop-blur-sm transition hover:bg-white hover:text-[#b85a38] disabled:opacity-50"
          />
        )}
      </div>
      <div className={compact ? 'p-2.5 sm:p-3.5' : 'p-3.5 sm:p-4'}>
        {details}
        {footer}
      </div>
    </article>
  )
}
