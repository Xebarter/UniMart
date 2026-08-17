import { ImageResponse } from 'next/og'
import { formatUGX, rentPeriodSuffix } from '@/lib/format'
import { fetchListing, listingShareDescription, listingShareImage } from '@/lib/listing-share'

export const runtime = 'edge'
export const alt = 'UniMart listing'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

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
  const description = listingShareDescription(listing, 160)

  if (photo) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            background: '#ffffff',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ width: '56%', height: '100%', display: 'flex', background: '#ecefed' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
          <div
            style={{
              width: '44%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '40px 36px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#d1734b',
                }}
              >
                {listing.category}
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontSize: 34,
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                  color: '#243e39',
                }}
              >
                {listing.title}
              </div>
              <div
                style={{
                  marginTop: 18,
                  fontSize: 20,
                  lineHeight: 1.5,
                  color: '#5f746c',
                }}
              >
                {description}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#d1734b', letterSpacing: '-0.02em' }}>
                {price}
                {period ? ` ${period}` : ''}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#315e55' }}>UniMart campus marketplace</div>
            </div>
          </div>
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
        <div style={{ marginTop: 22, fontSize: 24, lineHeight: 1.5, color: '#d4e4df', maxWidth: 980 }}>
          {description}
        </div>
        <div style={{ marginTop: 28, fontSize: 36, fontWeight: 800, color: '#f3c8ad' }}>
          {price}
          {period ? ` ${period}` : ''}
        </div>
        <div style={{ marginTop: 18, fontSize: 18, fontWeight: 700, color: '#c7ddd6' }}>UniMart campus marketplace</div>
      </div>
    ),
    { ...size },
  )
}
