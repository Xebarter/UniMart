import { dbError, jsonError, jsonOk, requireUser } from '@/lib/api/http'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaytotaPurchase, isPaytotaPaid } from '@/lib/payments/paytota'
import { verifyDpoToken } from '@/lib/payments/dpo'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const paymentId = new URL(request.url).searchParams.get('payment_id')
  if (!paymentId) return jsonError('payment_id is required.')
  const { data, error } = await auth.supabase.from('payments').select('*').eq('id', paymentId).eq('user_id', auth.user.id).maybeSingle()
  if (error) return dbError(error, 'Unable to load payment.')
  if (!data) return jsonError('Payment not found.', 404)
  const publicData = { id: data.id, status: data.status, amount: data.amount, currency: data.currency }
  if (data.status === 'paid') return jsonOk({ data: publicData })

  try {
    const admin = createAdminClient()
    if (data.provider === 'paytota' && data.provider_payment_id) {
      const purchase = await getPaytotaPurchase(data.provider_payment_id)
      if (isPaytotaPaid(purchase?.purchase?.status || purchase?.status)) {
        await admin.rpc('fulfill_payment', { p_payment_id: data.id })
        const { data: updated } = await auth.supabase.from('payments').select('id, status, amount, currency').eq('id', paymentId).single()
        return jsonOk({ data: updated })
      }
    }
    if (data.provider === 'dpo' && data.provider_payment_id) {
      const verified = await verifyDpoToken(data.provider_payment_id)
      if (verified.paid) {
        await admin.rpc('fulfill_payment', { p_payment_id: data.id })
        const { data: updated } = await auth.supabase.from('payments').select('id, status, amount, currency').eq('id', paymentId).single()
        return jsonOk({ data: updated })
      }
    }
  } catch {
    // Keep the stored status if the provider lookup fails.
  }
  return jsonOk({ data: publicData })
}
