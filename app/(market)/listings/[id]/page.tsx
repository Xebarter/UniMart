'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ListingDetail } from '@/components/market/listing-detail'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import type { Listing } from '@/lib/types'

export default function ListingPage() {
  const { id } = useParams<{ id: string }>()
  const { listings } = useMarket()
  const cached = listings.find((item) => item.id === id)
  const [listing, setListing] = useState<Listing | null>(cached ?? null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.listing(id)
      .then((result) => setListing(result.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Listing not found.'))
  }, [id])

  if (error && !listing) {
    return <div className="px-5 py-20 text-center text-sm text-[#81908b]">{error}</div>
  }
  if (!listing) {
    return <div className="px-5 py-20 text-center text-sm text-[#81908b]">Loading listing…</div>
  }
  return <ListingDetail listing={listing} />
}
