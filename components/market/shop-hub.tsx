'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Archive, ExternalLink, Pencil, Plus, RefreshCw, Star } from 'lucide-react'
import { ListingPhoto } from '@/components/listing-photo'
import { ListingCard } from '@/components/market/listing-card'
import { PhoneContactGate } from '@/components/market/phone-contact-gate'
import { ShopHero } from '@/components/market/shop-hero'
import { FeaturePayButtons, useFeatureCheckout } from '@/components/market/use-feature-checkout'
import { useFeaturePrices } from '@/components/market/use-feature-prices'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { formatUGX, isFeatured, rentPeriodSuffix } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import { isListingInShop } from '@/lib/shop'
import type { Listing, ListingStatus, Shop } from '@/lib/types'

type ShopFilter = 'all' | 'live' | 'featured' | 'sold' | 'archived'

const FILTERS: { id: ShopFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'featured', label: 'Featured' },
  { id: 'sold', label: 'Sold' },
  { id: 'archived', label: 'Archived' },
]

function matchesFilter(listing: Listing, filter: ShopFilter) {
  if (listing.status === 'removed') return false
  if (filter === 'all') return true
  if (filter === 'live') return listing.status === 'active'
  if (filter === 'featured') return isFeatured(listing)
  if (filter === 'sold') return listing.status === 'sold'
  return listing.status === 'archived'
}

export function ShopHub({
  shop,
  onEditShop,
  onCompose,
}: {
  shop: Shop
  onEditShop: () => void
  onCompose?: () => void
}) {
  const { profile, myListings, loading, notify, updateMyListing, saved, toggleSaved, refresh } = useMarket()
  const [filter, setFilter] = useState<ShopFilter>('all')
  const [busyId, setBusyId] = useState('')
  const [featureId, setFeatureId] = useState('')
  const [phoneGate, setPhoneGate] = useState(false)
  const { amountFor, durationDays } = useFeaturePrices(Boolean(featureId))
  const checkout = useFeatureCheckout({
    listingId: featureId,
    onPaid: () => {
      notify('Featured for 7 days.')
      setFeatureId('')
      void refresh()
    },
    onNeedPhone: () => setPhoneGate(true),
  })
  const [followerCount, setFollowerCount] = useState<number | undefined>()

  const shopListings = useMemo(
    () => myListings.filter((item) => isListingInShop(item, shop.id)),
    [myListings, shop.id],
  )
  const available = useMemo(
    () => myListings.filter((item) => item.status === 'active' && !isListingInShop(item, shop.id)),
    [myListings, shop.id],
  )
  const liveCount = shopListings.filter((item) => item.status === 'active').length
  const shown = useMemo(
    () => shopListings.filter((item) => matchesFilter(item, filter)),
    [filter, shopListings],
  )

  useEffect(() => {
    api.shopBySlug(shop.slug)
      .then((result) => setFollowerCount(result.follower_count))
      .catch(() => undefined)
  }, [shop.slug])

  async function setShopMembership(listing: Listing, inShop: boolean) {
    setBusyId(listing.id)
    try {
      const result = await api.updateListing(listing.id, { shop_id: inShop ? shop.id : null })
      updateMyListing(result.data)
      notify(inShop ? 'Added' : 'Removed')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update shop')
    } finally {
      setBusyId('')
    }
  }

  async function setStatus(listing: Listing, status: ListingStatus) {
    setBusyId(listing.id)
    try {
      const result = await api.updateListing(listing.id, { status })
      updateMyListing(result.data)
      notify(status === 'sold' ? 'Sold' : status === 'active' ? 'Live' : 'Updated')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update listing')
    } finally {
      setBusyId('')
    }
  }

  async function archiveListing(listing: Listing) {
    setBusyId(listing.id)
    try {
      await api.deleteListing(listing.id)
      updateMyListing({ ...listing, status: 'archived' })
      notify('Archived')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to archive listing')
    } finally {
      setBusyId('')
    }
  }

  function cardActions(listing: Listing) {
    const featured = isFeatured(listing)
    const busy = busyId === listing.id
    const live = listing.status === 'active'
    const pill = 'inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-[#e4ebe8] bg-[#fbfcfb] px-2 text-[11px] font-semibold tracking-[-0.02em] text-[#456059] transition hover:border-[#c9d8d2] hover:bg-white disabled:opacity-50 sm:flex-none sm:gap-1.5 sm:bg-white sm:px-3 sm:shadow-[0_1px_2px_rgba(36,62,57,0.05)]'
    return (
      <div className="flex w-full min-w-0 gap-1.5 sm:mt-3 sm:flex-wrap">
        <Link href={marketPaths.postEdit(listing.id)} className={pill}>
          <Pencil size={13} strokeWidth={2.1} /> Edit
        </Link>
        {live && !featured && (
          <button type="button" disabled={busy} onClick={() => { checkout.reset(); setFeatureId((current) => current === listing.id ? '' : listing.id) }} className={`${pill} border-[#f0d4c6] bg-[#fff8f4] text-[#b9623e] hover:border-[#e8c4b0]`}>
            <Star size={13} strokeWidth={2.1} /> Feature
          </button>
        )}
        {(listing.status === 'sold' || listing.status === 'archived') && (
          <button type="button" disabled={busy} onClick={() => { void setStatus(listing, 'active') }} className={pill}>
            <RefreshCw size={13} strokeWidth={2.1} /> Relist
          </button>
        )}
        {listing.status !== 'archived' && (
          <button type="button" disabled={busy} onClick={() => { void archiveListing(listing) }} className={pill}>
            <Archive size={13} strokeWidth={2.1} /> Archive
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <ShopHero
        shop={shop}
        owner={shop.profiles ?? profile}
        followerCount={followerCount}
        listingCount={liveCount}
        actions={(
          <>
            <Link href={marketPaths.shopPublic(shop.slug)} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#dfe7e3] px-3.5 text-xs font-bold text-[#526861] hover:bg-[#f6f9f8]">
              <ExternalLink size={14} /> View
            </Link>
            <button type="button" onClick={onEditShop} className="inline-flex h-10 items-center rounded-xl border border-[#dfe7e3] px-3.5 text-xs font-bold text-[#526861] hover:bg-[#f6f9f8]">
              Edit
            </button>
            {onCompose ? (
              <button type="button" onClick={onCompose} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#315e55] px-3.5 text-xs font-bold text-white hover:bg-[#274c44]">
                <Plus size={14} /> List shop items
              </button>
            ) : (
              <Link href={marketPaths.postShop} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#315e55] px-3.5 text-xs font-bold text-white hover:bg-[#274c44]">
                <Plus size={14} /> List shop items
              </Link>
            )}
          </>
        )}
      />

      {loading && !shopListings.length && !available.length && (
        <p className="mt-8 text-sm text-[#81908b]">Loading…</p>
      )}

      {!loading && !myListings.length && (
        <div className="mt-6 rounded-[20px] border border-dashed border-[#d5e4de] bg-[#f7fbf9] px-5 py-10 text-center sm:mt-8 sm:rounded-[24px] sm:px-6 sm:py-12">
          <p className="font-display text-lg font-bold text-[#29463f] sm:text-xl">No listings yet</p>
          {onCompose ? (
            <button type="button" onClick={onCompose} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#315e55] px-5 text-sm font-bold text-white hover:bg-[#274c44]">
              <Plus size={16} /> List shop items
            </button>
          ) : (
            <Link href={marketPaths.postShop} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#315e55] px-5 text-sm font-bold text-white hover:bg-[#274c44]">
              <Plus size={16} /> List shop items
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <h2 className="font-display text-lg font-bold text-[#29463f] sm:text-xl">In this shop</h2>
        {shopListings.length > 3 && (
          <div className="-mx-3.5 flex gap-1.5 overflow-x-auto px-3.5 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                  filter === item.id ? 'bg-[#315e55] text-white' : 'border border-[#e5eae7] bg-white text-[#6e8079]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {shown.length ? (
        <div className="mt-4 grid w-full min-w-0 gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {shown.map((listing) => (
            <div key={listing.id} className="min-w-0 max-w-full">
              <ListingCard
                item={listing}
                saved={saved.includes(listing.id)}
                toggleSaved={toggleSaved}
                hideSave
                hideSeller
                row
                onRemove={() => { void setShopMembership(listing, false) }}
                removeBusy={busyId === listing.id}
                removeLabel="Remove from shop"
                footer={cardActions(listing)}
              />
              {featureId === listing.id && (
                <div className="mt-2 rounded-2xl border border-[#e5eae7] bg-[#f8fbf9] p-2.5 sm:p-3">
                  {amountFor(listing.category) != null && (
                    <p className="px-1 pb-2 text-xs font-bold text-[#243e39]">
                      {formatUGX(amountFor(listing.category) ?? 0)}
                      <span className="ml-1 font-semibold text-[#8b9994]">· {durationDays} days</span>
                    </p>
                  )}
                  <FeaturePayButtons checkout={checkout} compact />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-[20px] border border-dashed border-[#d5e4de] bg-[#f7fbf9] px-5 py-8 text-center text-sm text-[#748780] sm:mt-5 sm:rounded-[24px] sm:px-6 sm:py-10">
          Nothing in this shop yet.
        </p>
      )}

      {available.length > 0 && (
        <section className="mt-8 sm:mt-10">
          <h2 className="font-display text-lg font-bold text-[#29463f] sm:text-xl">Your Other Listings</h2>
          <ul className="mt-3.5 overflow-hidden rounded-[18px] border border-[#e5eae7] bg-white sm:mt-4 sm:rounded-[20px]">
            {available.map((listing) => {
              const busy = busyId === listing.id
              const featured = isFeatured(listing)
              const iconBtn = 'flex size-9 shrink-0 items-center justify-center rounded-full text-[#5a6f69] transition hover:bg-[#f4f7f6] hover:text-[#315e55] disabled:opacity-50'
              return (
                <li key={listing.id} className="border-b border-[#eef3f0] last:border-b-0 hover:bg-[#fafcfb]">
                  <div className="flex min-w-0 items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
                    <ListingPhoto listing={listing} alt="" className="size-14 shrink-0 rounded-[14px] sm:size-[4.5rem] sm:rounded-[16px]" />
                    <span className="min-w-0 flex-1 overflow-hidden">
                      <span className="block truncate text-sm font-semibold tracking-[-0.01em] text-[#29463f] sm:text-[15px]">{listing.title}</span>
                      <span className="mt-0.5 block truncate text-[13px] font-semibold text-[#d1734b] sm:mt-1 sm:text-sm">
                        {formatUGX(Number(listing.price), listing.currency)}
                        {listing.category === 'Rentals' && rentPeriodSuffix(listing.rent_period) && (
                          <span className="font-semibold text-[#9aa7a2]"> {rentPeriodSuffix(listing.rent_period)}</span>
                        )}
                      </span>
                    </span>
                    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                      <Link href={marketPaths.postEdit(listing.id)} aria-label={`Edit ${listing.title}`} className={iconBtn}>
                        <Pencil size={16} strokeWidth={2.1} />
                      </Link>
                      {!featured && (
                        <button
                          type="button"
                          aria-label={`Feature ${listing.title}`}
                          disabled={busy}
                          onClick={() => { checkout.reset(); setFeatureId((current) => current === listing.id ? '' : listing.id) }}
                          className={`${iconBtn} text-[#b9623e] hover:bg-[#fff8f4] hover:text-[#b9623e]`}
                        >
                          <Star size={16} strokeWidth={2.1} />
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={`Archive ${listing.title}`}
                        disabled={busy}
                        onClick={() => { void archiveListing(listing) }}
                        className={`${iconBtn} hover:text-[#b85a38]`}
                      >
                        <Archive size={16} strokeWidth={2.1} />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => { void setShopMembership(listing, true) }}
                        className="ml-1 inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-[#315e55] px-3.5 text-[11px] font-semibold tracking-[-0.02em] text-white shadow-[0_3px_10px_rgba(49,94,85,0.18)] transition hover:bg-[#274c44] disabled:opacity-50 sm:px-4 sm:text-xs"
                      >
                        <Plus size={14} strokeWidth={2.4} /> Add
                      </button>
                    </div>
                  </div>
                  {featureId === listing.id && (
                    <div className="px-3 pb-3 sm:px-5">
                      <div className="rounded-2xl border border-[#e5eae7] bg-[#f8fbf9] p-2.5 sm:p-3">
                        {amountFor(listing.category) != null && (
                          <p className="px-1 pb-2 text-xs font-bold text-[#243e39]">
                            {formatUGX(amountFor(listing.category) ?? 0)}
                            <span className="ml-1 font-semibold text-[#8b9994]">· {durationDays} days</span>
                          </p>
                        )}
                        <FeaturePayButtons checkout={checkout} compact />
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}
      <PhoneContactGate
        open={phoneGate}
        onClose={() => setPhoneGate(false)}
        onSaved={() => {
          setPhoneGate(false)
          void checkout.pay('mobile_money')
        }}
      />
    </div>
  )
}
