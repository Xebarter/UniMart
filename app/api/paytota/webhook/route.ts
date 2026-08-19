import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPaytotaFailed, isPaytotaPaid, verifyPaytotaSignature } from '@/lib/payments/paytota'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const raw = await request.text()
  const signature = request.headers.get('x-signature') || request.headers.get('X-Signature')
  if (!verifyPaytotaSignature(raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }
  let payload: {
    id?: string
    status?: string
    event_type?: string
    purchase?: { status?: string; reference?: string }
    reference?: string
  }
  try {
    payload = JSON.parse(raw || '{}')
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }
  const status = payload.purchase?.status || payload.status
  const reference = payload.purchase?.reference || payload.reference
  const providerId = payload.id
  const admin = createAdminClient()
  let query = admin.from('payments').select('*').eq('provider', 'paytota')
  if (reference) query = query.eq('id', reference)
  else if (providerId) query = query.eq('provider_payment_id', providerId)
  else return NextResponse.json({ received: true })
  const { data: payment } = await query.maybeSingle()
  if (!payment) return NextResponse.json({ received: true })
  if (isPaytotaPaid(status)) {
    await admin.rpc('fulfill_payment', { p_payment_id: payment.id })
  } else if (isPaytotaFailed(status)) {
    await admin.from('payments').update({ status: status?.toLowerCase() === 'expired' ? 'expired' : status?.toLowerCase().startsWith('cancel') ? 'cancelled' : 'failed', raw: payload }).eq('id', payment.id)
  } else {
    await admin.from('payments').update({ raw: payload }).eq('id', payment.id)
  }
  return NextResponse.json({ received: true })
}
