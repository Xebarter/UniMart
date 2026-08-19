import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { interpretPaytotaPurchase, verifyPaytotaSignature, type PaytotaPurchase } from '@/lib/payments/paytota'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const raw = await request.text()
  const signature = request.headers.get('x-signature') || request.headers.get('X-Signature')
  if (!verifyPaytotaSignature(raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }
  let payload: PaytotaPurchase
  try {
    payload = JSON.parse(raw || '{}')
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }
  const reference = payload.reference || payload.purchase?.reference
  const providerId = payload.id
  const admin = createAdminClient()
  let payment = null
  if (reference) {
    const { data } = await admin.from('payments').select('*').eq('provider', 'paytota').eq('id', reference).maybeSingle()
    payment = data
  }
  if (!payment && providerId) {
    const { data } = await admin.from('payments').select('*').eq('provider', 'paytota').eq('provider_payment_id', providerId).maybeSingle()
    payment = data
  }
  if (!payment) return NextResponse.json({ received: true })
  const outcome = interpretPaytotaPurchase(payload)
  if (outcome === 'paid') {
    await admin.rpc('fulfill_payment', { p_payment_id: payment.id })
    await admin.from('payments').update({ raw: payload }).eq('id', payment.id)
  } else if (outcome === 'failed') {
    const status = (payload.status ?? '').toLowerCase()
    await admin.from('payments').update({
      status: status === 'expired' ? 'expired' : status.startsWith('cancel') ? 'cancelled' : 'failed',
      raw: payload,
    }).eq('id', payment.id)
  } else {
    await admin.from('payments').update({ raw: payload }).eq('id', payment.id)
  }
  return NextResponse.json({ received: true })
}
