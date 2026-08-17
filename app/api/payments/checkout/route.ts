import { dbError, jsonError, jsonOk, parseJson, rejectIfRestricted, requireUser } from '@/lib/api/http'
import { createPaytotaPurchase } from '@/lib/payments/paytota'
import { createDpoToken } from '@/lib/payments/dpo'
import { checkoutErrorMessage, parsePaymentMethod, providerForMethod } from '@/lib/payments/methods'

const FEATURE_PRICE = Number(process.env.FEATURED_LISTING_PRICE_UGX ?? 15000)

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'http://localhost:3000'
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const restricted = await rejectIfRestricted(auth.supabase, auth.user.id)
  if (restricted) return restricted
  const body = await parseJson<{ listing_id?: string; method?: string }>(request)
  const listingId = body?.listing_id
  const method = parsePaymentMethod(body?.method)
  if (!listingId) return jsonError('listing_id is required.')
  if (!method) return jsonError('Choose mobile money or card.')
  const provider = providerForMethod(method)
  const { data: listing, error: listingError } = await auth.supabase.from('listings').select('id, title, owner_id').eq('id', listingId).maybeSingle()
  if (listingError) return dbError(listingError, 'Unable to load listing.')
  if (!listing || listing.owner_id !== auth.user.id) return jsonError('You can only promote your own listing.', 403)

  const { data: payment, error } = await auth.supabase
    .from('payments')
    .insert({
      user_id: auth.user.id,
      listing_id: listingId,
      provider,
      purpose: 'listing_feature',
      amount: FEATURE_PRICE,
      currency: 'UGX',
      status: 'pending',
    })
    .select()
    .single()
  if (error || !payment) return dbError(error, 'Unable to create payment.', 400)

  const origin = appUrl()
  const successUrl = process.env.PAYTOTA_SUCCESS_REDIRECT || `${origin}/payments/success?payment_id=${payment.id}`
  const failureUrl = process.env.PAYTOTA_FAILURE_REDIRECT || `${origin}/payments/failure?payment_id=${payment.id}`
  const cancelUrl = process.env.PAYTOTA_CANCEL_REDIRECT || `${origin}/payments/cancel?payment_id=${payment.id}`
  const email = auth.user.email || 'student@unimart.app'
  const names = (auth.user.user_metadata?.display_name as string | undefined)?.split(' ') ?? ['UniMart', 'Student']

  try {
    if (method === 'mobile_money') {
      const purchase = await createPaytotaPurchase({
        email,
        amount: FEATURE_PRICE,
        reference: payment.id,
        description: `Feature listing: ${listing.title}`,
        successUrl: `${successUrl}${successUrl.includes('?') ? '&' : '?'}payment_id=${payment.id}`,
        failureUrl: `${failureUrl}${failureUrl.includes('?') ? '&' : '?'}payment_id=${payment.id}`,
        cancelUrl: `${cancelUrl}${cancelUrl.includes('?') ? '&' : '?'}payment_id=${payment.id}`,
      })
      const checkoutUrl = purchase.checkout_url
      if (!checkoutUrl) throw new Error('Unable to start mobile money checkout.')
      await auth.supabase.from('payments').update({ provider_payment_id: purchase.id, checkout_url: checkoutUrl, raw: purchase }).eq('id', payment.id)
      return jsonOk({ checkout_url: checkoutUrl }, 201)
    }

    const cardCheckout = await createDpoToken({
      amount: FEATURE_PRICE,
      reference: payment.id,
      description: `Feature listing: ${listing.title}`,
      email,
      firstName: names[0] || 'Student',
      lastName: names.slice(1).join(' ') || 'UniMart',
      redirectUrl: `${origin}/api/dpo/callback?payment_id=${payment.id}`,
      backUrl: `${origin}/api/dpo/callback?payment_id=${payment.id}`,
    })
    await auth.supabase.from('payments').update({ provider_payment_id: cardCheckout.transToken, checkout_url: cardCheckout.checkoutUrl, raw: { xml: cardCheckout.raw } }).eq('id', payment.id)
    return jsonOk({ checkout_url: cardCheckout.checkoutUrl }, 201)
  } catch (err) {
    console.error('[unimart:checkout]', method, err instanceof Error ? err.message : err)
    await auth.supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id)
    return jsonError(checkoutErrorMessage(method), 502)
  }
}
