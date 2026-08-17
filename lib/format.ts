import type { Listing, ListingCategory, RentPeriod } from '@/lib/types'

export function formatUGX(amount: number, currency = 'UGX') {
  const value = Number.isFinite(amount) ? Math.round(amount) : 0
  return `${currency} ${value.toLocaleString('en-UG')}`
}

export function parsePrice(input: string | number) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : NaN
  const n = Number(String(input).replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : NaN
}

export function initials(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'U'
  return `${parts[0][0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
}

const PALETTE = ['#d7e8e2', '#f4d8bd', '#d9e5e8', '#e3d7ee', '#dce4ee', '#f0dfbd']

export function colorFromSeed(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export function categoryGradient(category: string) {
  switch (category) {
    case 'Products':
      return 'linear-gradient(135deg, #e8e5df 0%, #b9b2a8 100%)'
    case 'Services':
      return 'linear-gradient(135deg, #efd9ca 0%, #bd866e 100%)'
    case 'Rentals':
      return 'linear-gradient(135deg, #d3e2e4 0%, #7fa2a6 100%)'
    default:
      return 'linear-gradient(135deg, #dcd2e9 0%, #80649c 100%)'
  }
}

export function isFeatured(listing: Pick<Listing, 'featured_until'>) {
  return Boolean(listing.featured_until && new Date(listing.featured_until).getTime() > Date.now())
}

export function listingTag(listing: Listing) {
  if (isFeatured(listing)) return 'Featured'
  if (listing.profiles?.verified) return 'Verified seller'
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  if (new Date(listing.created_at).getTime() > weekAgo) return 'New this week'
  return undefined
}

function mediaUrl(item: NonNullable<Listing['listing_media']>[number]) {
  if (item.public_url) return item.public_url
  if (!item.storage_path) return ''
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return base ? `${base}/storage/v1/object/public/listing-media/${item.storage_path}` : ''
}

export function listingPhotos(listing: Listing) {
  const media = [...(listing.listing_media ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const urls = media.map(mediaUrl).filter(Boolean)
  return urls.length ? urls : [categoryGradient(listing.category)]
}

export function listingImage(listing: Listing) {
  return listingPhotos(listing)[0]
}

export function conditionLabel(value?: string | null) {
  if (!value) return null
  if (value === 'like new') return 'Like new'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function isCategory(value: string): value is ListingCategory {
  return value === 'Products' || value === 'Services' || value === 'Rentals' || value === 'Gigs'
}

export function isRentPeriod(value: string): value is RentPeriod {
  return value === 'day' || value === 'week' || value === 'month'
}

export function rentPeriodLabel(period?: string | null) {
  if (period === 'day') return 'Per day'
  if (period === 'week') return 'Per week'
  if (period === 'month') return 'Per month'
  return null
}

export function rentPeriodSuffix(period?: string | null) {
  if (period === 'day') return '/ day'
  if (period === 'week') return '/ week'
  if (period === 'month') return '/ month'
  return null
}

export function timeAgo(value: string) {
  const delta = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.round(delta / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function readTime(body: string) {
  const minutes = Math.max(1, Math.round(body.split(/\s+/).length / 180))
  return `${minutes} min read`
}
