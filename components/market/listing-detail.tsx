'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, Smartphone } from 'lucide-react'
import { ListingPhoto } from '@/components/listing-photo'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { loginHref } from '@/lib/auth'
import { formatUGX } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import type { Listing } from '@/lib/types'

export function ListingDetail({ listing }: { listing: Listing }) {
  const router = useRouter()
  const { profile, saved, toggleSaved, notify, refresh } = useMarket()
  const [payOpen, setPayOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [payError, setPayError] = useState('')
  const isOwner = profile?.id === listing.owner_id
  const isSaved = saved.includes(listing.id)

  async function pay(method: 'mobile_money' | 'card') {
    setBusy(true)
    setPayError('')
    try {
      const result = await api.checkout({ listing_id: listing.id, method })
      if (!result.checkout_url) throw new Error('Unable to start checkout. Please try again.')
      window.location.href = result.checkout_url
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Unable to start checkout. Please try again.')
      setBusy(false)
    }
  }

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

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-8 sm:py-10">
      <Link href={marketPaths.home} className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#638076]">
        <ArrowLeft size={15} /> Back to marketplace
      </Link>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#d1734b]">{listing.category}</p>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.04em] text-[#29463f]">{listing.title}</h1>
      <p className="mt-2 text-lg font-bold text-[#d1734b]">{formatUGX(Number(listing.price), listing.currency)}</p>
      <ListingPhoto listing={listing} alt={listing.title} className="mt-5 aspect-[4/3] w-full rounded-2xl" />
      <p className="mt-5 text-sm leading-6 text-[#71827b]">{listing.description}</p>
      <p className="mt-3 text-xs text-[#8b9994]">{listing.location} · {listing.profiles?.display_name}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {isOwner && !payOpen && (
          <button onClick={() => setPayOpen(true)} className="rounded-xl bg-[#d1734b] px-4 py-2.5 text-xs font-bold text-white">Feature this listing</button>
        )}
        {isOwner && (
          <Link href={marketPaths.post} className="rounded-xl border border-[#dfe7e3] px-4 py-2.5 text-xs font-bold text-[#638076]">Manage in shop</Link>
        )}
        {!isOwner && (
          <button onClick={() => { void messageSeller() }} className="rounded-xl bg-[#315e55] px-4 py-2.5 text-xs font-bold text-white">Message seller</button>
        )}
        <button onClick={() => { void toggleSaved(listing.id) }} className="rounded-xl border border-[#dfe7e3] px-4 py-2.5 text-xs font-bold text-[#638076]">{isSaved ? 'Saved' : 'Save'}</button>
        {!isOwner && <button onClick={() => { void reportListing() }} className="rounded-xl border border-[#dfe7e3] px-4 py-2.5 text-xs font-bold text-[#638076]">Report</button>}
      </div>
      {isOwner && payOpen && (
        <div className="mt-4 rounded-2xl border border-[#e5eae7] bg-[#f8fbf9] p-4">
          <p className="text-xs font-bold text-[#526861]">How would you like to pay?</p>
          <p className="mt-1 text-[11px] text-[#8b9994]">Choose mobile money or a card to feature this listing.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" disabled={busy} onClick={() => pay('mobile_money')} className="flex flex-col items-center gap-2 rounded-xl border border-[#dfe7e3] bg-white px-3 py-3.5 text-xs font-bold text-[#315e55] transition hover:border-[#8bb4a7] disabled:opacity-60">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#e7f0ed] text-[#315e55]"><Smartphone size={18} /></span>
              {busy ? 'Opening…' : 'Mobile money'}
            </button>
            <button type="button" disabled={busy} onClick={() => pay('card')} className="flex flex-col items-center gap-2 rounded-xl border border-[#dfe7e3] bg-white px-3 py-3.5 text-xs font-bold text-[#315e55] transition hover:border-[#8bb4a7] disabled:opacity-60">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#fff5f0] text-[#d1734b]"><CreditCard size={18} /></span>
              {busy ? 'Opening…' : 'Card'}
            </button>
          </div>
          {payError && <p className="mt-3 text-[11px] font-medium text-[#c86c48]">{payError}</p>}
        </div>
      )}
    </div>
  )
}
