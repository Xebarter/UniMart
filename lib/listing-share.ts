import { createClient } from '@supabase/supabase-js'
import { formatUGX, listingImage, rentPeriodSuffix } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import type { Listing } from '@/lib/types'

const LISTING_SELECT = '*, listing_media(*), profiles:owner_id(id, display_name, university, campus, avatar_url, verified)'

function createPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables.')
  return createClient(url, key, { auth: { persistSession: false } })
}

export function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.SITE_URL ?? 'http://localhost:3000'
}

export async function fetchListing(id: string): Promise<Listing | null> {
  const supabase = createPublicSupabase()
  const { data, error } = await supabase.from('listings').select(LISTING_SELECT).eq('id', id).maybeSingle()
  if (error || !data) return null
  return data as Listing
}

export function isShareableImage(url: string) {
  return url.startsWith('http://') || url.startsWith('https://')
}

export function listingShareImage(listing: Listing): string | null {
  const image = listingImage(listing)
  return isShareableImage(image) ? image : null
}

export function listingShareDescription(listing: Listing, max = 200) {
  const price = formatUGX(Number(listing.price), listing.currency)
  const period = listing.category === 'Rentals' ? rentPeriodSuffix(listing.rent_period) : ''
  const body = listing.description?.trim() || `${listing.category} listing on UniMart.`
  const lead = `${body} — ${price}${period ? ` ${period}` : ''} on UniMart.`
  if (lead.length <= max) return lead
  return `${lead.slice(0, max - 1).trim()}…`
}

export function listingShareTitle(listing: Listing) {
  const price = formatUGX(Number(listing.price), listing.currency)
  return `${listing.title} · ${price}`
}

export function listingShareUrl(id: string) {
  return new URL(marketPaths.listing(id), appBaseUrl()).toString()
}

export function listingOpenGraphImageUrl(id: string) {
  return new URL(`${marketPaths.listing(id)}/opengraph-image`, appBaseUrl()).toString()
}
