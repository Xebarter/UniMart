'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { GigDetail } from '@/components/market/gig-detail'
import { ListingDetail } from '@/components/market/listing-detail'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { marketPaths } from '@/lib/market-paths'
import type { Listing } from '@/lib/types'

export function ListingPageClient({ initialListing }: { initialListing?: Listing | null }) {
  const { id } = useParams<{ id: string }>()
  const { listings } = useMarket()
  const cached = listings.find((item) => item.id === id) ?? initialListing ?? null
  const [listing, setListing] = useState<Listing | null>(cached)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.listing(id)
      .then((result) => setListing(result.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Listing not found.'))
  }, [id])

  if (error && !listing) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1180px] flex-col items-center justify-center px-5 py-16 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">Listing</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-[#29463f]">We could not find that listing</h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[#81908b]">{error}</p>
        <Link href={marketPaths.home} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#315e55] px-4 py-2.5 text-xs font-bold text-white">
          <ArrowLeft size={14} /> Back to marketplace
        </Link>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-8 sm:py-8 lg:px-10">
        <div className="mb-6 h-3 w-48 animate-pulse rounded-full bg-[#e7eeea]" />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-8">
          <div className="aspect-[4/3] animate-pulse rounded-[28px] bg-[#e7eeea] sm:aspect-[5/4]" />
          <div className="rounded-[28px] border border-[#e5eae7] bg-white p-6">
            <div className="h-3 w-20 animate-pulse rounded-full bg-[#e7eeea]" />
            <div className="mt-4 h-8 w-3/4 animate-pulse rounded-xl bg-[#e7eeea]" />
            <div className="mt-3 h-7 w-40 animate-pulse rounded-xl bg-[#f0d5c6]" />
            <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-[#e7eeea]" />
            <div className="mt-2 h-12 w-full animate-pulse rounded-xl bg-[#eef3f1]" />
          </div>
        </div>
      </div>
    )
  }

  return listing.category === 'Gigs' ? <GigDetail listing={listing} /> : <ListingDetail listing={listing} />
}
