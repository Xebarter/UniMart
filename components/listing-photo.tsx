'use client'

import { listingImage } from '@/lib/format'
import type { Listing } from '@/lib/types'

export function ListingPhoto({
  listing,
  src,
  alt = '',
  className = '',
}: {
  listing?: Pick<Listing, 'category' | 'listing_media'>
  src?: string
  alt?: string
  className?: string
}) {
  const image = src || (listing ? listingImage(listing as Listing) : '')
  const isPhoto = image.startsWith('http') || image.startsWith('blob:') || image.startsWith('data:')

  if (!isPhoto) {
    return <div className={`overflow-hidden ${className}`} style={{ background: image || '#dce4ee' }} />
  }

  return (
    <div className={`overflow-hidden bg-[#ecefed] ${className}`}>
      <img src={image} alt={alt} className="size-full object-cover object-center" />
    </div>
  )
}
