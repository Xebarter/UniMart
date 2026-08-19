import type { SupabaseClient } from '@supabase/supabase-js'

const FEATURE_MS = 7 * 24 * 60 * 60 * 1000

export async function fulfillPaidPayment(
  admin: SupabaseClient,
  paymentId: string,
  raw?: unknown,
) {
  const { error } = await admin.rpc('fulfill_payment', { p_payment_id: paymentId })
  if (!error) {
    if (raw !== undefined) await admin.from('payments').update({ raw }).eq('id', paymentId)
    return
  }

  console.error('[unimart:fulfill]', error.message)
  const { data: payment } = await admin.from('payments').select('*').eq('id', paymentId).maybeSingle()
  if (!payment) return
  if (payment.status !== 'paid') {
    await admin.from('payments').update({
      status: 'paid',
      paid_at: payment.paid_at ?? new Date().toISOString(),
      ...(raw !== undefined ? { raw } : {}),
    }).eq('id', paymentId)
    if (payment.purpose === 'listing_feature' && payment.listing_id) {
      const { data: listing } = await admin.from('listings').select('featured_until').eq('id', payment.listing_id).maybeSingle()
      const current = listing?.featured_until ? new Date(listing.featured_until).getTime() : 0
      const base = Math.max(current, Date.now())
      await admin.from('listings').update({
        featured_until: new Date(base + FEATURE_MS).toISOString(),
      }).eq('id', payment.listing_id)
    }
    return
  }
  if (raw !== undefined) await admin.from('payments').update({ raw }).eq('id', paymentId)
}
