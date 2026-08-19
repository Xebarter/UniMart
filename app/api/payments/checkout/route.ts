import { dbError, jsonError, jsonOk, parseJson, rejectIfRestricted, requireUser } from '@/lib/api/http'
import { createPaytotaPurchase, executePaytotaCollection } from '@/lib/payments/paytota'
import { createDpoToken } from '@/lib/payments/dpo'
import { featurePriceFor, loadFeaturePrices } from '@/lib/payments/feature-prices'
import { checkoutErrorMessage, parsePaymentMethod, providerForMethod } from '@/lib/payments/methods'
import { hasContactPhone } from '@/lib/phone'

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
  const { data: listing, error: listingError } = await auth.supabase
    .from('listings')
    .select('id, title, owner_id, category')
    .eq('id', listingId)
    .maybeSingle()
  if (listingError) return dbError(listingError, 'Unable to load listing.')
  if (!listing || listing.owner_id !== auth.user.id) return jsonError('You can only promote your own listing.', 403)

  const { data: owner } = await auth.supabase.from('profiles').select('phone_primary').eq('id', auth.user.id).maybeSingle()
  const phone = owner?.phone_primary?.trim() ?? ''
  if (method === 'mobile_money' && !hasContactPhone(phone)) {
    return jsonError('Add a mobile money number on your profile first.', 400)
  }

  let amount: number
  try {
    const prices = await loadFeaturePrices(auth.supabase)
    amount = featurePriceFor(prices.map, listing.category)
  } catch (error) {
    return dbError(error as { message?: string }, 'Unable to load feature prices.')
  }
  if (!amount) return jsonError('Feature pricing is not configured for this listing type.')

  const { data: payment, error } = await auth.supabase
    .from('payments')
    .insert({
      user_id: auth.user.id,
      listing_id: listingId,
      provider,
      purpose: 'listing_feature',
      amount,
      currency: 'UGX',
      status: 'pending',
    })
    .select()
    .single()
  if (error || !payment) return dbError(error, 'Unable to create payment.', 400)

  const origin = appUrl()
  const callbackBase = (process.env.DPO_BACK_URL || `${origin}/api/dpo/callback`).split('?')[0]
  const email = auth.user.email || 'student@unimart.app'
  const names = (auth.user.user_metadata?.display_name as string | undefined)?.split(' ') ?? ['UniMart', 'Student']
  const description = `Feature ${listing.category}: ${listing.title}`

  try {
    if (method === 'mobile_money') {
      const purchase = await createPaytotaPurchase({
        email,
        phone,
        amount,
        reference: payment.id,
        description,
      })
      const executed = await executePaytotaCollection(purchase.id)
      await auth.supabase
        .from('payments')
        .update({ provider_payment_id: purchase.id, checkout_url: null, raw: { purchase, execute: executed } })
        .eq('id', payment.id)
      return jsonOk({ payment_id: payment.id, status: 'pending_execute', phone }, 201)
    }

    const cardCheckout = await createDpoToken({
      amount,
      reference: payment.id,
      description,
      email,
      firstName: names[0] || 'Student',
      lastName: names.slice(1).join(' ') || 'UniMart',
      redirectUrl: `${origin}/payments/success?payment_id=${payment.id}`,
      backUrl: `${callbackBase}?payment_id=${payment.id}`,
      phone,
    })
    await auth.supabase.from('payments').update({
      provider_payment_id: cardCheckout.transToken,
      provider_reference: cardCheckout.transRef || null,
      checkout_url: cardCheckout.checkoutUrl,
      raw: { xml: cardCheckout.raw, transRef: cardCheckout.transRef },
    }).eq('id', payment.id)
    return jsonOk({ payment_id: payment.id, checkout_url: cardCheckout.checkoutUrl }, 201)
  } catch (err) {
    console.error('[unimart:checkout]', method, err instanceof Error ? err.message : err)
    await auth.supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id)
    const detail = err instanceof Error ? err.message : ''
    return jsonError(detail || checkoutErrorMessage(method), 502)
  }
}
