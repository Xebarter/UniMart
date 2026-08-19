import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fulfillPaidPayment } from '@/lib/payments/fulfill'
import {
  getPaytotaPurchase,
  interpretPaytotaPurchase,
  verifyPaytotaSignature,
  type PaytotaPurchase,
} from '@/lib/payments/paytota'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const raw = await request.text()
  const signature = request.headers.get('x-signature') || request.headers.get('X-Signature')
  const signed = verifyPaytotaSignature(raw, signature)
  if (!signed) {
    console.warn('[unimart:paytota-webhook] signature missing or invalid')
  }

  let payload: PaytotaPurchase
  try {
    payload = JSON.parse(raw || '{}') as PaytotaPurchase
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }

  const providerId = payload.id
  if (providerId) {
    const live = await getPaytotaPurchase(providerId)
    if (live) payload = live
    else if (!signed) return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  } else if (!signed) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  const reference = payload.reference || payload.purchase?.reference
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

  if (!payment.provider_payment_id && providerId) {
    await admin.from('payments').update({ provider_payment_id: providerId }).eq('id', payment.id)
  }

  const outcome = interpretPaytotaPurchase(payload)
  if (outcome === 'paid') {
    await fulfillPaidPayment(admin, payment.id, payload)
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
