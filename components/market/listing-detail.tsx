'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Pencil,
  Share2,
  Sparkles,
  Store,
  X,
} from 'lucide-react'
import { ListingPhoto } from '@/components/listing-photo'
import { Avatar } from '@/components/market/avatar'
import { ListingShareSheet, ListingShareTrigger } from '@/components/market/listing-share'
import { ListingCard } from '@/components/market/listing-card'
import { PhoneContactGate } from '@/components/market/phone-contact-gate'
import { FeaturePayButtons, useFeatureCheckout } from '@/components/market/use-feature-checkout'
import { useFeaturePrices } from '@/components/market/use-feature-prices'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { loginHref } from '@/lib/auth'
import { colorFromSeed, conditionLabel, formatUGX, isFeatured, listingPhotos, rentPeriodLabel, rentPeriodSuffix, timeAgo } from '@/lib/format'
import { isListingInShop } from '@/lib/shop'
import { marketPaths } from '@/lib/market-paths'
import { formatPhoneDisplay, hasContactPhone } from '@/lib/phone'
import type { Listing, Shop } from '@/lib/types'

export function ListingDetail({ listing }: { listing: Listing }) {
  const router = useRouter()
  const { profile, saved, toggleSaved, notify, refresh, myShop, updateMyListing, listings } = useMarket()
  const [payOpen, setPayOpen] = useState(false)
  const [phoneGate, setPhoneGate] = useState(false)
  const [busy, setBusy] = useState(false)
  const checkout = useFeatureCheckout({
    listingId: listing.id,
    onPaid: () => {
      notify('Featured for 7 days.')
      setPayOpen(false)
      void refresh()
    },
    onNeedPhone: () => setPhoneGate(true),
  })
  const [followingShop, setFollowingShop] = useState(false)
  const [sellerShop, setSellerShop] = useState<Shop | null>(null)
  const [shopId, setShopId] = useState(listing.shop_id ?? null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)
  const { amountFor, durationDays } = useFeaturePrices(payOpen)
  const featurePrice = amountFor(listing.category)
  const isOwner = profile?.id === listing.owner_id
  const isSaved = saved.includes(listing.id)
  const shop = isOwner ? myShop : sellerShop
  const inShop = Boolean(shop && isListingInShop({ shop_id: shopId }, shop.id))
  const featured = isFeatured(listing)
  const photos = useMemo(() => listingPhotos(listing), [listing])
  const activePhoto = photos[Math.min(photoIndex, photos.length - 1)] ?? photos[0]
  const seller = listing.profiles?.display_name ?? 'Seller'
  const condition = listing.category === 'Products' ? conditionLabel(listing.condition) : null
  const period = listing.category === 'Rentals' ? rentPeriodLabel(listing.rent_period) : null
  const unavailable = listing.status === 'sold' || listing.status === 'archived' || listing.status === 'removed'
  const sellerPhones = [listing.profiles?.phone_primary, listing.profiles?.phone_secondary].filter(
    (value): value is string => hasContactPhone(value),
  )

  const related = useMemo(() => {
    const others = listings.filter((item) => item.id !== listing.id && item.status === 'active')
    const sameCategory = others.filter((item) => item.category === listing.category)
    return [...sameCategory, ...others.filter((item) => item.category !== listing.category)].slice(0, 4)
  }, [listing.category, listing.id, listings])

  useEffect(() => {
    setShopId(listing.shop_id ?? null)
    setPhotoIndex(0)
  }, [listing.id, listing.shop_id])

  useEffect(() => {
    if (isOwner) return
    api.shopByOwner(listing.owner_id)
      .then((result) => setSellerShop(result.data))
      .catch(() => setSellerShop(null))
  }, [isOwner, listing.owner_id])

  useEffect(() => {
    if (isOwner || !profile) return
    api.follows()
      .then((result) => setFollowingShop(result.data.some((item) => item.id === listing.owner_id)))
      .catch(() => undefined)
  }, [isOwner, listing.owner_id, profile])

  async function messageSeller() {
    if (!profile) {
      window.location.href = loginHref(marketPaths.listing(listing.id))
      return
    }
    const result = await api.startConversation({ recipient_id: listing.owner_id, listing_id: listing.id })
    await refresh()
    router.push(marketPaths.conversation(result.data.id))
  }

  async function reportListing() {
    if (!profile) {
      window.location.href = loginHref(marketPaths.listing(listing.id))
      return
    }
    await api.report({ listing_id: listing.id, reason: 'Suspicious listing' })
    notify('Report submitted. Our team will review it.')
  }

  async function toggleShopMembership() {
    if (!myShop) return
    setBusy(true)
    try {
      const result = await api.updateListing(listing.id, { shop_id: inShop ? null : myShop.id })
      setShopId(result.data.shop_id ?? null)
      updateMyListing(result.data)
      notify(inShop ? 'Removed from your shop. It is still a listing.' : 'Added to your shop')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update shop')
    } finally {
      setBusy(false)
    }
  }

  async function toggleFollow() {
    if (!profile) {
      window.location.href = loginHref(marketPaths.listing(listing.id))
      return
    }
    try {
      if (followingShop) {
        await api.unfollow(listing.owner_id)
        setFollowingShop(false)
        notify('Unfollowed')
      } else {
        await api.follow(listing.owner_id)
        setFollowingShop(true)
        notify(`Following ${shop?.name ?? seller}`)
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update follow')
    }
  }

  function shiftPhoto(delta: number) {
    setPhotoIndex((current) => (current + delta + photos.length) % photos.length)
  }

  const statusCopy = listing.status === 'sold'
    ? 'This listing has been sold.'
    : listing.status === 'archived' || listing.status === 'removed'
      ? 'This listing is no longer available.'
      : listing.status === 'pending'
        ? 'This listing is waiting for review.'
        : null

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-8 sm:py-8 lg:px-10 lg:pb-12">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#8b9994] sm:mb-7">
        <Link href={marketPaths.home} className="inline-flex items-center gap-1.5 text-[#638076] transition hover:text-[#315e55]">
          <ArrowLeft size={14} /> Marketplace
        </Link>
        <span className="text-[#c5d0cb]">/</span>
        <span>{listing.category}</span>
        <span className="text-[#c5d0cb]">/</span>
        <span className="max-w-[16rem] truncate text-[#526861]">{listing.title}</span>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-8">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_12px_40px_rgba(36,62,57,0.06)] sm:rounded-[28px]">
            <div className="relative">
              <ListingPhoto src={activePhoto} listing={listing} alt={listing.title} className="aspect-[4/3] w-full sm:aspect-[5/4]" />
              <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4">
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold text-[#52635e] shadow-sm backdrop-blur-sm">{listing.category}</span>
                  {featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#d1734b] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                      <Sparkles size={11} /> Featured
                    </span>
                  )}
                  {listing.status === 'sold' && (
                    <span className="rounded-full bg-[#29463f] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">Sold</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <ListingShareTrigger listing={listing} onClick={() => setShareOpen(true)} className="size-10 border-white/70 bg-white/92 text-[#8b9994] shadow-sm backdrop-blur-sm hover:text-[#315e55]" />
                  <button
                    type="button"
                    aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      void toggleSaved(listing.id, listing)
                    }}
                    className={`flex size-10 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition ${isSaved ? 'border-[#f0c7b3] bg-[#fff5f0] text-[#d1734b]' : 'border-white/70 bg-white/92 text-[#8b9994] hover:text-[#d1734b]'}`}
                  >
                    <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
              {photos.length > 1 && (
                <>
                  <button type="button" aria-label="Previous photo" onClick={() => shiftPhoto(-1)} className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#315e55] shadow-sm backdrop-blur-sm transition hover:bg-white">
                    <ChevronLeft size={18} />
                  </button>
                  <button type="button" aria-label="Next photo" onClick={() => shiftPhoto(1)} className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#315e55] shadow-sm backdrop-blur-sm transition hover:bg-white">
                    <ChevronRight size={18} />
                  </button>
                  <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0c1c19]/55 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                    {Math.min(photoIndex, photos.length - 1) + 1} / {photos.length}
                  </p>
                </>
              )}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3 no-scrollbar sm:p-4">
                {photos.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    aria-label={`View photo ${index + 1}`}
                    onClick={() => setPhotoIndex(index)}
                    className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:size-[72px] ${index === photoIndex ? 'border-[#315e55]' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <ListingPhoto src={src} listing={listing} alt="" className="size-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <section className="mt-5 rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_8px_24px_rgba(36,62,57,0.04)] sm:mt-6 sm:rounded-[28px] sm:p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">About this listing</p>
            <h2 className="mt-2 font-display text-xl font-bold tracking-[-0.03em] text-[#29463f]">Details</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#5f746c]">
              {listing.description?.trim() || 'The seller has not added a description yet.'}
            </p>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <MetaRow label="Category" value={listing.category} />
              {condition && <MetaRow label="Condition" value={condition} />}
              {period && <MetaRow label="Period" value={period} />}
              <MetaRow label="Location" value={listing.location || 'Uganda'} />
              <MetaRow label="Listed" value={timeAgo(listing.created_at)} />
            </dl>
          </section>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24">
          <div className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_12px_40px_rgba(36,62,57,0.06)] sm:rounded-[28px] sm:p-6">
            {statusCopy && (
              <p className="mb-4 rounded-2xl bg-[#f4f7f6] px-3.5 py-2.5 text-xs font-semibold text-[#526861]">{statusCopy}</p>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">{listing.category}</p>
                <h1 className="mt-2 font-display text-[1.65rem] font-bold leading-tight tracking-[-0.04em] text-[#243e39] sm:text-[1.85rem]">{listing.title}</h1>
              </div>
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#dfe7e3] bg-[#f7fbf9] px-3.5 py-2.5 text-xs font-bold text-[#315e55] shadow-[0_1px_2px_rgba(36,62,57,0.04)] transition hover:border-[#b8d1c9] hover:bg-white hover:text-[#243e39]"
              >
                <Share2 size={14} /> Share
              </button>
            </div>
            <p className="mt-3 font-display text-2xl font-bold tracking-[-0.03em] text-[#d1734b]">
              {formatUGX(Number(listing.price), listing.currency)}
              {listing.category === 'Rentals' && rentPeriodSuffix(listing.rent_period) && (
                <span className="ml-1.5 text-base font-semibold tracking-[-0.02em] text-[#9aa7a2]">{rentPeriodSuffix(listing.rent_period)}</span>
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {condition && <Chip>{condition}</Chip>}
              {period && <Chip>{period}</Chip>}
              <Chip icon={<MapPin size={12} />}>{listing.location || 'Uganda'}</Chip>
              <Chip icon={<Eye size={12} />}>{listing.view_count ?? 0} view{(listing.view_count ?? 0) === 1 ? '' : 's'}</Chip>
            </div>

            <div className="mt-5 space-y-2">
              {isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={() => { checkout.reset(); setPayOpen(true) }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d1734b] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#c26640]"
                  >
                    <Sparkles size={16} /> {featured ? 'Boost again' : 'Feature this listing'}
                  </button>
                  <Link href={marketPaths.postEdit(listing.id)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfe7e3] px-4 py-3 text-sm font-bold text-[#315e55] transition hover:border-[#b8d1c9] hover:bg-[#f7fbf9]">
                    <Pencil size={15} /> Edit listing
                  </Link>
                  {myShop ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => { void toggleShopMembership() }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfe7e3] px-4 py-3 text-sm font-bold text-[#315e55] transition hover:border-[#b8d1c9] hover:bg-[#f7fbf9] disabled:opacity-60"
                    >
                      <Store size={15} /> {inShop ? 'Remove from shop' : 'Add to shop'}
                    </button>
                  ) : (
                    <Link href={marketPaths.shop} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfe7e3] px-4 py-3 text-sm font-bold text-[#315e55] transition hover:border-[#b8d1c9] hover:bg-[#f7fbf9]">
                      <Store size={15} /> Open a shop
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setShareOpen(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfe7e3] px-4 py-3 text-sm font-bold text-[#315e55] transition hover:border-[#b8d1c9] hover:bg-[#f7fbf9]"
                  >
                    <Share2 size={15} /> Share listing
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={unavailable}
                    onClick={() => { void messageSeller() }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#315e55] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#294f47] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MessageCircle size={16} /> Message seller
                  </button>
                  {sellerPhones.length ? (
                    <div className="space-y-2">
                      {sellerPhones.map((phone) => (
                        <div key={phone} className="flex items-center gap-2 rounded-xl border border-[#dfe7e3] bg-[#f7fbf9] px-3 py-2">
                          <p className="min-w-0 flex-1 truncate text-sm font-bold text-[#29463f]">{formatPhoneDisplay(phone)}</p>
                          <a
                            href={`tel:${phone}`}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#315e55] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#294f47]"
                          >
                            <Phone size={13} /> Call
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <p className="mt-4 text-[11px] leading-5 text-[#8b9994]">Meet in a public place. Confirm the item in person before you pay.</p>
          </div>

          <div className="mt-4 rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_8px_24px_rgba(36,62,57,0.04)] sm:rounded-[28px] sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Seller</p>
            <div className="mt-3 flex items-start gap-3">
              <Avatar name={seller} color={colorFromSeed(listing.owner_id)} image={listing.profiles?.avatar_url} size="lg" />
              <div className="min-w-0 pt-0.5">
                <p className="flex items-center gap-1.5 font-display text-lg font-bold tracking-[-0.03em] text-[#243e39]">
                  <span className="truncate">{seller}</span>
                  {listing.profiles?.verified && <BadgeCheck size={16} className="shrink-0 text-[#4e786a]" />}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#748780]">
                  {[listing.profiles?.university, listing.profiles?.campus].filter(Boolean).join(' · ') || 'Seller'}
                </p>
              </div>
            </div>
            {!isOwner && shop && inShop && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href={marketPaths.shopPublic(shop.slug)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#dfe7e3] px-3 py-2.5 text-xs font-bold text-[#315e55] transition hover:border-[#b8d1c9]">
                  <Store size={14} /> Visit shop
                </Link>
                <button type="button" onClick={() => { void toggleFollow() }} className="rounded-xl border border-[#dfe7e3] px-3 py-2.5 text-xs font-bold text-[#315e55] transition hover:border-[#b8d1c9]">
                  {followingShop ? 'Following' : 'Follow shop'}
                </button>
              </div>
            )}
            {isOwner && myShop && (
              <Link href={marketPaths.shop} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#dfe7e3] px-3 py-2.5 text-xs font-bold text-[#315e55] transition hover:border-[#b8d1c9]">
                <Store size={14} /> Manage shop
              </Link>
            )}
          </div>

          {!isOwner && (
            <button type="button" onClick={() => { void reportListing() }} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-[#8b9994] transition hover:text-[#9a4f32]">
              <Flag size={12} /> Report this listing
            </button>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-10 sm:mt-12">
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">More like this</p>
            <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.03em] text-[#29463f]">Similar listings</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {related.map((item) => (
              <ListingCard key={item.id} item={item} saved={saved.includes(item.id)} toggleSaved={toggleSaved} />
            ))}
          </div>
        </section>
      )}

      <ListingShareSheet listing={listing} open={shareOpen} onClose={() => setShareOpen(false)} />

      {payOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button type="button" aria-label="Close" onClick={() => { checkout.reset(); setPayOpen(false) }} className="absolute inset-0 bg-[#0c1c19]/50 backdrop-blur-[6px]" />
          <div className="relative w-full max-w-md rounded-t-[28px] border border-[#e5eae7] bg-white p-6 shadow-[0_24px_80px_rgba(8,24,20,0.28)] sm:rounded-[28px] sm:p-7">
            <button type="button" aria-label="Close checkout" onClick={() => { checkout.reset(); setPayOpen(false) }} className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-[#e5eae7] text-[#687b75] transition hover:bg-[#f7fbf9]">
              <X size={16} />
            </button>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Feature listing</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-[#243e39]">Get more eyes on this post</h2>
            <p className="mt-2 text-sm leading-6 text-[#71827b]">Featured listings appear first in search. Mobile money is collected directly on your phone. Cards use DPO.</p>
            {featurePrice != null && (
              <p className="mt-3 font-display text-xl font-bold tracking-[-0.03em] text-[#243e39]">
                {formatUGX(featurePrice)}
                <span className="ml-1.5 text-sm font-semibold text-[#8b9994]">· {durationDays} days</span>
              </p>
            )}
            <FeaturePayButtons checkout={checkout} />
          </div>
        </div>
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

function Chip({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#e5eae7] bg-[#f7fbf9] px-2.5 py-1 text-[11px] font-semibold text-[#5f746c]">
      {icon}
      {children}
    </span>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f7fbf9] px-4 py-3">
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b9994]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#29463f]">{value}</dd>
    </div>
  )
}
