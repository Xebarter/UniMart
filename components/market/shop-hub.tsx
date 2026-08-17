'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Archive, CreditCard, Eye, Pencil, Plus, Smartphone, Sparkles, Store, X } from 'lucide-react'
import { ListingPhoto } from '@/components/listing-photo'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { formatUGX, isFeatured } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import type { Listing, ListingStatus } from '@/lib/types'

type ShopFilter = 'all' | 'live' | 'featured' | 'sold' | 'archived'

const FILTERS: { id: ShopFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'featured', label: 'Featured' },
  { id: 'sold', label: 'Sold' },
  { id: 'archived', label: 'Archived' },
]

function statusLabel(listing: Listing) {
  if (listing.status === 'sold') return 'Sold'
  if (listing.status === 'archived') return 'Archived'
  if (listing.status === 'draft') return 'Draft'
  return 'Live'
}

function matchesFilter(listing: Listing, filter: ShopFilter) {
  if (listing.status === 'removed') return false
  if (filter === 'all') return true
  if (filter === 'live') return listing.status === 'active'
  if (filter === 'featured') return isFeatured(listing)
  if (filter === 'sold') return listing.status === 'sold'
  return listing.status === 'archived'
}

export function ShopHub() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const publishedId = searchParams.get('published')
  const { myListings, loading, notify, updateMyListing } = useMarket()
  const [filter, setFilter] = useState<ShopFilter>('all')
  const [busyId, setBusyId] = useState('')
  const [featureId, setFeatureId] = useState('')
  const [payError, setPayError] = useState('')

  const stats = useMemo(() => {
    const live = myListings.filter((item) => item.status === 'active')
    return {
      live: live.length,
      views: myListings.reduce((sum, item) => sum + (item.view_count ?? 0), 0),
      featured: myListings.filter((item) => isFeatured(item)).length,
      sold: myListings.filter((item) => item.status === 'sold').length,
    }
  }, [myListings])

  const shown = useMemo(
    () => myListings.filter((item) => matchesFilter(item, filter)),
    [filter, myListings],
  )

  async function setStatus(listing: Listing, status: ListingStatus) {
    setBusyId(listing.id)
    try {
      const result = await api.updateListing(listing.id, { status })
      updateMyListing(result.data)
      notify(status === 'sold' ? 'Marked as sold' : status === 'active' ? 'Listing is live again' : 'Listing updated')
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
      notify('Listing archived')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to archive listing')
    } finally {
      setBusyId('')
    }
  }

  async function pay(listingId: string, method: 'mobile_money' | 'card') {
    setBusyId(listingId)
    setPayError('')
    try {
      const result = await api.checkout({ listing_id: listingId, method })
      if (!result.checkout_url) throw new Error('Unable to start checkout. Please try again.')
      window.location.href = result.checkout_url
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Unable to start checkout. Please try again.')
      setBusyId('')
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-8 pt-5 sm:px-8 sm:pt-8 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">Your shop</p>
          <h1 className="mt-2 font-display text-[1.85rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.35rem]">Manage what you sell.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#748780]">Stats, edits, and status live here. Profile stays a simple list of your listings.</p>
        </div>
        <Link href={marketPaths.postNew} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#315e55] px-4 text-sm font-bold text-white hover:bg-[#274c44]">
          <Plus size={16} /> New listing
        </Link>
      </div>

      {publishedId && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#cfe0d9] bg-[#eaf3ef] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-[#315e55]">Listing saved. Campus can find it from here.</p>
          <div className="flex items-center gap-2">
            <Link href={marketPaths.listing(publishedId)} className="inline-flex h-9 items-center rounded-xl bg-[#315e55] px-3 text-[11px] font-bold text-white">
              See it live
            </Link>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => router.replace(marketPaths.post)}
              className="flex size-9 items-center justify-center rounded-xl text-[#526861] hover:bg-white/70"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Live', value: stats.live },
          { label: 'Views', value: stats.views },
          { label: 'Featured', value: stats.featured },
          { label: 'Sold', value: stats.sold },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#e5eae7] bg-white px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">{item.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-[#29463f]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
              filter === item.id ? 'bg-[#315e55] text-white' : 'border border-[#e5eae7] bg-white text-[#6e8079] hover:border-[#bfd4cc]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && !myListings.length && (
        <p className="mt-8 text-sm text-[#81908b]">Loading your catalogue…</p>
      )}

      {!loading && !myListings.length && (
        <div className="mt-10 rounded-[24px] border border-dashed border-[#d5e4de] bg-[#f7fbf9] px-6 py-14 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-[#d1734b] shadow-[0_8px_24px_rgba(49,94,85,0.08)]">
            <Store size={22} />
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold text-[#29463f]">Your shop is empty.</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#748780]">Put something up for campus. A clear photo and a fair price usually get the first message.</p>
          <Link href={marketPaths.postNew} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#315e55] px-5 text-sm font-bold text-white hover:bg-[#274c44]">
            Create a listing
          </Link>
        </div>
      )}

      {Boolean(shown.length) && (
        <ul className="mt-5 space-y-3">
          {shown.map((listing) => {
            const featured = isFeatured(listing)
            const busy = busyId === listing.id
            const live = listing.status === 'active'
            return (
              <li key={listing.id} className="overflow-hidden rounded-2xl border border-[#e5eae7] bg-white">
                <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                  <ListingPhoto listing={listing} alt={listing.title} className="size-[72px] shrink-0 rounded-xl sm:size-24" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        listing.status === 'sold' ? 'bg-[#fff5f0] text-[#d1734b]'
                          : listing.status === 'archived' ? 'bg-[#f3f5f4] text-[#7d9089]'
                          : 'bg-[#e7f0ed] text-[#315e55]'
                      }`}>{statusLabel(listing)}</span>
                      {featured && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#fff5f0] px-1.5 py-0.5 text-[10px] font-bold text-[#d1734b]">
                          <Sparkles size={10} /> Featured
                        </span>
                      )}
                    </div>
                    <h2 className="mt-1 truncate font-display text-base font-bold text-[#29463f]">{listing.title}</h2>
                    <p className="mt-0.5 text-sm font-bold text-[#d1734b]">{formatUGX(Number(listing.price), listing.currency)}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#8c9995]">
                      <Eye size={12} /> {listing.view_count ?? 0} views
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-[#eef3f0] px-3 py-3 sm:px-4">
                  <Link href={marketPaths.postEdit(listing.id)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#dfe7e3] px-3 text-[11px] font-bold text-[#526861] hover:bg-[#f6f9f8]">
                    <Pencil size={13} /> Edit
                  </Link>
                  <Link href={marketPaths.listing(listing.id)} className="inline-flex h-9 items-center rounded-xl border border-[#dfe7e3] px-3 text-[11px] font-bold text-[#526861] hover:bg-[#f6f9f8]">
                    View live
                  </Link>
                  {live && !featured && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => { setPayError(''); setFeatureId((current) => current === listing.id ? '' : listing.id) }}
                      className="inline-flex h-9 items-center rounded-xl bg-[#d1734b] px-3 text-[11px] font-bold text-white disabled:opacity-60"
                    >
                      Feature
                    </button>
                  )}
                  {live && (
                    <button type="button" disabled={busy} onClick={() => { void setStatus(listing, 'sold') }} className="inline-flex h-9 items-center rounded-xl border border-[#dfe7e3] px-3 text-[11px] font-bold text-[#526861] hover:bg-[#f6f9f8] disabled:opacity-60">
                      Mark sold
                    </button>
                  )}
                  {(listing.status === 'sold' || listing.status === 'archived') && (
                    <button type="button" disabled={busy} onClick={() => { void setStatus(listing, 'active') }} className="inline-flex h-9 items-center rounded-xl border border-[#dfe7e3] px-3 text-[11px] font-bold text-[#526861] hover:bg-[#f6f9f8] disabled:opacity-60">
                      Relist
                    </button>
                  )}
                  {listing.status !== 'archived' && (
                    <button type="button" disabled={busy} onClick={() => { void archiveListing(listing) }} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#dfe7e3] px-3 text-[11px] font-bold text-[#526861] hover:bg-[#f6f9f8] disabled:opacity-60">
                      <Archive size={13} /> Archive
                    </button>
                  )}
                </div>
                {featureId === listing.id && (
                  <div className="border-t border-[#eef3f0] bg-[#f8fbf9] px-3 py-3 sm:px-4">
                    <p className="text-xs font-bold text-[#526861]">How would you like to pay?</p>
                    <p className="mt-1 text-[11px] text-[#8b9994]">Choose mobile money or a card to feature this listing.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" disabled={busy} onClick={() => { void pay(listing.id, 'mobile_money') }} className="flex flex-col items-center gap-2 rounded-xl border border-[#dfe7e3] bg-white px-3 py-3.5 text-xs font-bold text-[#315e55] transition hover:border-[#8bb4a7] disabled:opacity-60">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-[#e7f0ed] text-[#315e55]"><Smartphone size={18} /></span>
                        {busy ? 'Opening…' : 'Mobile money'}
                      </button>
                      <button type="button" disabled={busy} onClick={() => { void pay(listing.id, 'card') }} className="flex flex-col items-center gap-2 rounded-xl border border-[#dfe7e3] bg-white px-3 py-3.5 text-xs font-bold text-[#315e55] transition hover:border-[#8bb4a7] disabled:opacity-60">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-[#fff5f0] text-[#d1734b]"><CreditCard size={18} /></span>
                        {busy ? 'Opening…' : 'Card'}
                      </button>
                    </div>
                    {payError && <p className="mt-3 text-[11px] font-medium text-[#c86c48]">{payError}</p>}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {!loading && myListings.length > 0 && shown.length === 0 && (
        <p className="mt-8 text-sm text-[#81908b]">Nothing in this filter yet.</p>
      )}
    </div>
  )
}
