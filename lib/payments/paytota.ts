import { createPublicKey, createVerify } from 'node:crypto'

const BASE_URL = process.env.PAYTOTA_BASE_URL || 'https://gate.paytota.com'

function secret() {
  const key = process.env.PAYTOTA_SECRET_KEY
  if (!key) throw new Error('Mobile money checkout is not configured.')
  return key
}

function gateUrl(path: string) {
  return `${BASE_URL.replace(/\/$/, '')}${path}`
}

export function paytotaMsisdn(e164: string) {
  return e164.replace(/\D/g, '')
}

export type PaytotaPurchase = {
  id: string
  status?: string
  event_type?: string
  marked_as_paid?: boolean
  checkout_url?: string
  reference?: string
  payment?: { paid_on?: number | string | null; amount?: number | null; status?: string }
  purchase?: { status?: string; reference?: string }
  status_history?: { status?: string }[]
  transaction_data?: {
    extra?: { payload?: { transaction?: { status?: string } } }
    attempts?: { successful?: boolean; error?: unknown }[]
  }
}

export type PaytotaExecuteResult = {
  status?: string
  details?: { return_code?: string; message?: string }
}

export async function createPaytotaPurchase(input: {
  email: string
  phone: string
  amount: number
  reference: string
  description: string
  successCallback?: string
}) {
  const response = await fetch(gateUrl('/api/v1/purchases/'), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${secret()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client: {
        email: input.email,
        phone: paytotaMsisdn(input.phone),
        country: 'UG',
      },
      purchase: {
        currency: 'UGX',
        products: [{ name: input.description, price: String(Math.round(input.amount)) }],
      },
      reference: input.reference,
      brand_id: process.env.PAYTOTA_BRAND_ID,
      skip_capture: false,
      ...(input.successCallback ? { success_callback: input.successCallback } : {}),
    }),
  })
  const data = (await response.json().catch(() => ({}))) as PaytotaPurchase & { detail?: string; error?: string }
  if (!response.ok || !data.id) {
    throw new Error('Unable to start mobile money checkout.')
  }
  return data
}

export async function executePaytotaCollection(purchaseId: string, phone?: string) {
  const form = new FormData()
  form.set('s2s', 'true')
  form.set('pm', 'paytota_proxy')
  if (phone) form.set('Phone', paytotaMsisdn(phone))
  const response = await fetch(gateUrl(`/p/${purchaseId}/`), {
    method: 'POST',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${secret()}` },
    body: form,
  })
  const data = (await response.json().catch(() => ({}))) as PaytotaExecuteResult & { detail?: string; error?: string }
  const code = String(data.details?.return_code ?? '')
  if (!response.ok || (code && code !== '200')) {
    throw new Error(data.details?.message || data.detail || data.error || 'Unable to send the mobile money prompt.')
  }
  return data
}

function asPurchase(body: unknown): PaytotaPurchase | null {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  if (typeof record.id === 'string') return body as PaytotaPurchase
  const nested = record.data
  if (nested && typeof nested === 'object' && typeof (nested as { id?: unknown }).id === 'string') {
    return nested as PaytotaPurchase
  }
  return null
}

export async function getPaytotaPurchase(id: string) {
  const response = await fetch(gateUrl(`/api/v1/purchases/${id}/`), {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${secret()}`,
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
    },
  })
  if (!response.ok) {
    console.error('[unimart:paytota-get]', id, response.status)
    return null
  }
  const purchase = asPurchase(await response.json().catch(() => null))
  console.info('[unimart:paytota-get]', id, purchase?.status, purchase?.event_type)
  return purchase
}

export function verifyPaytotaSignature(rawBody: string, signature: string | null) {
  const publicKey = process.env.PAYTOTA_WEBHOOK_PUBLIC_KEY
  if (!publicKey || !signature) return false
  try {
    const pem = publicKey.replace(/\\n/g, '\n')
    const key = createPublicKey(pem)
    const verifier = createVerify('SHA256')
    verifier.update(rawBody)
    verifier.end()
    return verifier.verify(key, signature, 'base64')
  } catch {
    return false
  }
}

export function isPaytotaPaid(status?: string) {
  const value = (status ?? '').toLowerCase().replace(/^purchase\./, '')
  return value === 'paid' || value === 'success' || value === 'completed' || value === 'captured' || value === 'hold' || value === 'settled'
}

export function isPaytotaFailed(status?: string) {
  const value = (status ?? '').toLowerCase().replace(/^purchase\./, '')
  return value === 'error' || value === 'failed' || value === 'payment_failure' || value === 'cancelled' || value === 'canceled' || value === 'expired'
}

function extraTransactionPaid(payload: PaytotaPurchase) {
  const status = String(payload.transaction_data?.extra?.payload?.transaction?.status ?? '').toLowerCase()
  return status === 'successful' || status === 'success' || status === 'paid'
}

export function interpretPaytotaPurchase(payload: PaytotaPurchase | null | undefined): 'paid' | 'pending' | 'failed' {
  if (!payload) return 'pending'
  const event = String(payload.event_type ?? '')
  if (event === 'purchase.paid' || event === 'purchase.captured' || event === 'purchase.settled' || event === 'purchase.hold') return 'paid'
  if (event === 'purchase.payment_failure' || event === 'purchase.cancelled') return 'failed'

  // Root `status` is PurchaseStatus. Nested `purchase` is the cart and usually has no status.
  const status = String(payload.status ?? '')
  if (isPaytotaPaid(status)) return 'paid'
  if (isPaytotaFailed(status)) return 'failed'

  if (payload.marked_as_paid || payload.payment?.paid_on || extraTransactionPaid(payload)) return 'paid'
  const history = payload.status_history ?? []
  if (history.some((item) => isPaytotaPaid(item?.status))) return 'paid'

  return 'pending'
}
