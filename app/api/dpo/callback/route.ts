import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  dpoPaymentIdFromFields,
  dpoTokenFromFields,
  parseDpoCallbackFields,
  reconcileDpoPayment,
} from '@/lib/payments/dpo'

export const runtime = 'nodejs'

function ok() {
  return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
}

async function handle(request: Request) {
  const fields = await parseDpoCallbackFields(request)
  const paymentId = dpoPaymentIdFromFields(fields)
  const transToken = dpoTokenFromFields(fields)
  const admin = createAdminClient()

  let payment = null
  if (paymentId) {
    const { data } = await admin.from('payments').select('*').eq('id', paymentId).eq('provider', 'dpo').maybeSingle()
    payment = data
  }
  if (!payment && transToken) {
    const { data } = await admin.from('payments').select('*').eq('provider_payment_id', transToken).maybeSingle()
    payment = data
  }
  if (!payment && fields.TransRef) {
    const { data } = await admin.from('payments').select('*').eq('provider_reference', fields.TransRef).maybeSingle()
    payment = data
  }
  if (!payment) return ok()
  if (payment.status === 'paid') return ok()

  if (!payment.provider_payment_id && transToken) {
    await admin.from('payments').update({ provider_payment_id: transToken }).eq('id', payment.id)
    payment.provider_payment_id = transToken
  }

  try {
    await reconcileDpoPayment(admin, payment, { callback: fields })
  } catch (error) {
    console.error('[unimart:dpo-callback]', error instanceof Error ? error.message : error)
  }
  return ok()
}

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}
