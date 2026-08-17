import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyDpoToken } from '@/lib/payments/dpo'

export const runtime = 'nodejs'

async function handle(request: Request) {
  const url = new URL(request.url)
  const paymentId = url.searchParams.get('payment_id') || url.searchParams.get('CompanyRef')
  const transToken = url.searchParams.get('TransactionToken') || url.searchParams.get('TransID') || url.searchParams.get('TransToken')
  const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || url.origin
  const admin = createAdminClient()

  let payment = null
  if (paymentId) {
    const { data } = await admin.from('payments').select('*').eq('id', paymentId).maybeSingle()
    payment = data
  }
  if (!payment && transToken) {
    const { data } = await admin.from('payments').select('*').eq('provider_payment_id', transToken).maybeSingle()
    payment = data
  }

  const token = transToken || payment?.provider_payment_id
  if (!payment || !token) {
    return NextResponse.redirect(`${origin}/payments/failure`)
  }

  try {
    const verified = await verifyDpoToken(token)
    if (verified.paid) {
      await admin.rpc('fulfill_payment', { p_payment_id: payment.id })
      await admin.from('payments').update({ raw: { ...payment.raw, verify: verified.raw } }).eq('id', payment.id)
      return NextResponse.redirect(`${origin}/payments/success?payment_id=${payment.id}`)
    }
    await admin.from('payments').update({ status: 'failed', raw: { ...payment.raw, verify: verified.raw } }).eq('id', payment.id)
    return NextResponse.redirect(`${origin}/payments/failure?payment_id=${payment.id}`)
  } catch {
    return NextResponse.redirect(`${origin}/payments/failure?payment_id=${payment.id}`)
  }
}

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}
