import { LISTING_CATEGORIES, type FeaturePrice, type FeaturePriceMap, type ListingCategory } from '@/lib/types'
import type { createClient as createServerSupabase } from '@/lib/supabase/server'

type Supabase = Awaited<ReturnType<typeof createServerSupabase>>

const envDefault = Number(process.env.FEATURED_LISTING_PRICE_UGX ?? 15000)

export const DEFAULT_FEATURE_PRICE_UGX =
  Number.isFinite(envDefault) && envDefault > 0 ? Math.round(envDefault) : 15000

export const FEATURE_DURATION_DAYS = 7
export const MAX_FEATURE_PRICE_UGX = 10_000_000

export function defaultFeaturePriceMap(): FeaturePriceMap {
  return {
    Products: DEFAULT_FEATURE_PRICE_UGX,
    Services: DEFAULT_FEATURE_PRICE_UGX,
    Rentals: DEFAULT_FEATURE_PRICE_UGX,
    Gigs: DEFAULT_FEATURE_PRICE_UGX,
  }
}

export function isMissingFeaturePricesTable(error: { message?: string } | null) {
  const message = error?.message ?? ''
  return /schema cache|does not exist|could not find the table/i.test(message)
}

export function parseFeatureAmount(value: unknown) {
  const amount = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^\d.]/g, ''))
  if (!Number.isFinite(amount) || amount <= 0) return null
  const rounded = Math.round(amount)
  if (rounded > MAX_FEATURE_PRICE_UGX) return null
  return rounded
}

export function rowsToPriceMap(rows: { category: string; amount_ugx: number }[] | null): FeaturePriceMap {
  const map = defaultFeaturePriceMap()
  for (const row of rows ?? []) {
    if (!LISTING_CATEGORIES.includes(row.category as ListingCategory)) continue
    const amount = parseFeatureAmount(row.amount_ugx)
    if (amount) map[row.category as ListingCategory] = amount
  }
  return map
}

export function featurePriceFor(map: FeaturePriceMap, category: string) {
  if (LISTING_CATEGORIES.includes(category as ListingCategory)) return map[category as ListingCategory]
  return DEFAULT_FEATURE_PRICE_UGX
}

export async function loadFeaturePrices(supabase: Supabase): Promise<{
  map: FeaturePriceMap
  rows: FeaturePrice[]
  missing: boolean
}> {
  const { data, error } = await supabase
    .from('feature_prices')
    .select('category, amount_ugx, updated_at, updated_by')
    .order('category')

  if (error) {
    if (isMissingFeaturePricesTable(error)) {
      return { map: defaultFeaturePriceMap(), rows: [], missing: true }
    }
    throw error
  }

  const rows = (data ?? []) as FeaturePrice[]
  return { map: rowsToPriceMap(rows), rows, missing: false }
}
