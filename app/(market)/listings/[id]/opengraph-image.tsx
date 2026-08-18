import { ImageResponse } from 'next/og'
import { formatUGX, rentPeriodSuffix } from '@/lib/format'
import { fetchListing, listingShareImage } from '@/lib/listing-share'

export const runtime = 'edge'
export const alt = 'UniMart listing'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = 60

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await fetchListing(id)

  if (!listing) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#315e55',
            color: 'white',
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          Listing not found
        </div>
      ),
      { ...size },
    )
  }

  const photo = listingShareImage(listing)
  const price = formatUGX(Number(listing.price), listing.currency)
  const period = listing.category === 'Rentals' ? rentPeriodSuffix(listing.rent_period) : ''

  if (photo) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            position: 'relative',
            background: '#ecefed',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt=""
            width={1200}
            height={630}
            style={{
              width: '1200px',
              height: '630px',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </div>
      ),
      { ...size },
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 56,
          background: 'linear-gradient(135deg, #315e55 0%, #1a3c36 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f3c8ad' }}>
          {listing.category}
        </div>
        <div style={{ marginTop: 16, fontSize: 54, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.04em', maxWidth: 980 }}>
          {listing.title}
        </div>
        <div style={{ marginTop: 28, fontSize: 36, fontWeight: 800, color: '#f3c8ad' }}>
          {price}
          {period ? ` ${period}` : ''}
        </div>
        <div style={{ marginTop: 18, fontSize: 18, fontWeight: 700, color: '#c7ddd6' }}>UniMart marketplace</div>
      </div>
    ),
    { ...size },
  )
}
