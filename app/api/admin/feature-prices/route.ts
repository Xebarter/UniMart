import { writeAudit } from '@/lib/admin/audit'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin, requireFullAdmin } from '@/lib/api/http'
import {
  FEATURE_DURATION_DAYS,
  isMissingFeaturePricesTable,
  loadFeaturePrices,
  parseFeatureAmount,
} from '@/lib/payments/feature-prices'
import { LISTING_CATEGORIES, type ListingCategory } from '@/lib/types'

function schemaOrDb(error: { message?: string } | null, fallback: string, status = 500) {
  if (isMissingFeaturePricesTable(error)) {
    return jsonError('Feature prices are not initialized. Run scripts/021_feature-prices.sql in the Supabase SQL editor.', 503)
  }
  return dbError(error, fallback, status)
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  try {
    const { map, rows, missing } = await loadFeaturePrices(auth.supabase)
    return jsonOk({
      data: LISTING_CATEGORIES.map((category) => ({
        category,
        amount_ugx: map[category],
        updated_at: rows.find((row) => row.category === category)?.updated_at ?? null,
        updated_by: rows.find((row) => row.category === category)?.updated_by ?? null,
      })),
      amounts: map,
      duration_days: FEATURE_DURATION_DAYS,
      can_edit: Boolean(auth.operator?.canManageRoles),
      missing,
    })
  } catch (error) {
    return schemaOrDb(error as { message?: string }, 'Unable to load feature prices.')
  }
}

export async function PATCH(request: Request) {
  const auth = await requireFullAdmin()
  if (auth.response) return auth.response
  const body = await parseJson<{ prices?: Record<string, unknown>; amounts?: Record<string, unknown> }>(request)
  const incoming = body?.prices ?? body?.amounts
  if (!incoming || typeof incoming !== 'object') return jsonError('Provide prices for each listing type.')

  const updates: { category: ListingCategory; amount_ugx: number }[] = []
  for (const category of LISTING_CATEGORIES) {
    if (!(category in incoming)) continue
    const amount = parseFeatureAmount(incoming[category])
    if (!amount) return jsonError(`${category} price must be a whole UGX amount greater than 0.`)
    updates.push({ category, amount_ugx: amount })
  }
  if (!updates.length) return jsonError('No prices provided.')

  for (const update of updates) {
    const { error } = await auth.supabase
      .from('feature_prices')
      .upsert(
        { category: update.category, amount_ugx: update.amount_ugx, updated_by: auth.user.id },
        { onConflict: 'category' },
      )
    if (error) return schemaOrDb(error, 'Unable to save feature prices.', 400)
  }

  await writeAudit(auth.supabase, {
    actorId: auth.user.id,
    action: 'payments.feature_prices',
    entityType: 'feature_prices',
    entityId: 'listing_feature',
    metadata: Object.fromEntries(updates.map((item) => [item.category, item.amount_ugx])),
  })

  try {
    const { map, rows, missing } = await loadFeaturePrices(auth.supabase)
    return jsonOk({
      data: LISTING_CATEGORIES.map((category) => ({
        category,
        amount_ugx: map[category],
        updated_at: rows.find((row) => row.category === category)?.updated_at ?? null,
        updated_by: rows.find((row) => row.category === category)?.updated_by ?? null,
      })),
      amounts: map,
      duration_days: FEATURE_DURATION_DAYS,
      can_edit: true,
      missing,
    })
  } catch (error) {
    return schemaOrDb(error as { message?: string }, 'Prices saved, but reload failed.')
  }
}
