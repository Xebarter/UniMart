import { LISTING_CATEGORIES, type Listing, type ListingCategory } from '@/lib/types'

export type MarketCategory = 'All' | ListingCategory

export function listingSearchText(item: Listing) {
  return `${item.title} ${item.description} ${item.profiles?.display_name ?? ''} ${item.location} ${item.category}`.toLowerCase()
}

export function matchesQuery(item: Listing, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return listingSearchText(item).includes(q)
}

export function scoreListing(item: Listing, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return 0
  const title = item.title.toLowerCase()
  const seller = (item.profiles?.display_name ?? '').toLowerCase()
  const location = (item.location ?? '').toLowerCase()
  if (title === q) return 100
  if (title.startsWith(q)) return 86
  if (title.includes(q)) return 72
  if (item.category.toLowerCase().startsWith(q)) return 54
  if (seller.startsWith(q) || seller.includes(q)) return 42
  if (location.includes(q)) return 34
  if (item.description.toLowerCase().includes(q)) return 18
  return 0
}

export function rankListings(listings: Listing[], query: string) {
  const q = query.trim()
  const matched = q ? listings.filter((item) => matchesQuery(item, q)) : listings
  if (!q) return matched
  return [...matched].sort((a, b) => scoreListing(b, q) - scoreListing(a, q))
}

export function matchingCategories(listings: Listing[], query: string) {
  const q = query.trim().toLowerCase()
  return LISTING_CATEGORIES.filter((category) => {
    if (!q) return true
    if (category.toLowerCase().includes(q)) return true
    return listings.some((item) => item.category === category)
  })
}

export function groupListingsByCategory(listings: Listing[]) {
  return LISTING_CATEGORIES.map((category) => ({
    category,
    items: listings.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0)
}
