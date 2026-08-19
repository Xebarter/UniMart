import { dbError, jsonOk } from '@/lib/api/http'
import { FEATURE_DURATION_DAYS, loadFeaturePrices } from '@/lib/payments/feature-prices'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  try {
    const { map } = await loadFeaturePrices(supabase)
    return jsonOk({ data: map, duration_days: FEATURE_DURATION_DAYS })
  } catch (error) {
    return dbError(error as { message?: string }, 'Unable to load feature prices.')
  }
}
