import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaytotaPurchase, isPaytotaPaid } from '@/lib/payments/paytota'
import { verifyDpoToken } from '@/lib/payments/dpo'

export const runtime = 'nodejs'

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization')
  const query = new URL(request.url).searchParams.get('secret')
  return header === `Bearer ${secret}` || query === secret
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const admin = createAdminClient()
  const { data: expired } = await admin.rpc('expire_featured_listings')

  const { data: pending } = await admin.from('payments').select('*').eq('status', 'pending').order('created_at', { ascending: true }).limit(40)
  let reconciled = 0
  for (const payment of pending ?? []) {
    try {
      if (payment.provider === 'paytota' && payment.provider_payment_id) {
        const purchase = await getPaytotaPurchase(payment.provider_payment_id)
        if (isPaytotaPaid(purchase?.purchase?.status || purchase?.status)) {
          await admin.rpc('fulfill_payment', { p_payment_id: payment.id })
          reconciled += 1
        }
      } else if (payment.provider === 'dpo' && payment.provider_payment_id) {
        const verified = await verifyDpoToken(payment.provider_payment_id)
        if (verified.paid) {
          await admin.rpc('fulfill_payment', { p_payment_id: payment.id })
          reconciled += 1
        }
      }
    } catch {
      // Continue remaining payments if one provider call fails.
    }
  }

  return NextResponse.json({ ok: true, expired: expired ?? 0, reconciled })
}
