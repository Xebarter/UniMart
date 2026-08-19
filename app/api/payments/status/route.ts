import { dbError, jsonError, jsonOk, requireUser } from '@/lib/api/http'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaytotaPurchase, interpretPaytotaPurchase } from '@/lib/payments/paytota'
import { reconcileDpoPayment } from '@/lib/payments/dpo'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const paymentId = new URL(request.url).searchParams.get('payment_id')
  if (!paymentId) return jsonError('payment_id is required.')
  const { data, error } = await auth.supabase.from('payments').select('*').eq('id', paymentId).eq('user_id', auth.user.id).maybeSingle()
  if (error) return dbError(error, 'Unable to load payment.')
  if (!data) return jsonError('Payment not found.', 404)
  const publicData = { id: data.id, status: data.status, amount: data.amount, currency: data.currency, purpose: data.purpose, listing_id: data.listing_id }
  if (data.status === 'paid') return jsonOk({ data: publicData })

  try {
    const admin = createAdminClient()
    if (data.provider === 'paytota' && data.provider_payment_id) {
      const purchase = await getPaytotaPurchase(data.provider_payment_id)
      const outcome = interpretPaytotaPurchase(purchase)
      if (outcome === 'paid') {
        await admin.rpc('fulfill_payment', { p_payment_id: data.id })
        await admin.from('payments').update({ raw: purchase ?? data.raw }).eq('id', data.id)
        const { data: updated } = await auth.supabase.from('payments').select('id, status, amount, currency').eq('id', paymentId).single()
        return jsonOk({ data: updated ?? { ...publicData, status: 'paid' } })
      }
      if (outcome === 'failed') {
        const providerStatus = (purchase?.status ?? '').toLowerCase()
        const next = providerStatus === 'expired' ? 'expired' : providerStatus.startsWith('cancel') ? 'cancelled' : 'failed'
        await admin.from('payments').update({ status: next, raw: purchase ?? data.raw }).eq('id', data.id)
        return jsonOk({ data: { ...publicData, status: next } })
      }
      if (purchase) {
        await admin.from('payments').update({ raw: purchase }).eq('id', data.id)
      }
    }
    if (data.provider === 'dpo' && data.provider_payment_id) {
      const reconciled = await reconcileDpoPayment(admin, data)
      if (reconciled.status !== data.status) {
        const { data: updated } = await auth.supabase.from('payments').select('id, status, amount, currency').eq('id', paymentId).single()
        return jsonOk({ data: updated ?? { ...publicData, status: reconciled.status } })
      }
      return jsonOk({ data: { ...publicData, status: reconciled.status } })
    }
  } catch (error) {
    console.error('[unimart:payment-status]', error instanceof Error ? error.message : error)
    // Keep the stored status if the provider lookup fails.
  }
  return jsonOk({ data: publicData })
}
