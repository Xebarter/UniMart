import { createVerify } from 'node:crypto'

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
  transaction_data?: { attempts?: { successful?: boolean; error?: unknown }[] }
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
}) {
  const response = await fetch(gateUrl('/api/v1/purchases/'), {
    method: 'POST',
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
        products: [{ name: input.description, price: String(input.amount) }],
      },
      reference: input.reference,
      brand_id: process.env.PAYTOTA_BRAND_ID,
      skip_capture: false,
    }),
  })
  const data = (await response.json().catch(() => ({}))) as PaytotaPurchase & { detail?: string; error?: string }
  if (!response.ok || !data.id) {
    throw new Error('Unable to start mobile money checkout.')
  }
  return data
}

export async function executePaytotaCollection(purchaseId: string) {
  const form = new FormData()
  form.set('s2s', 'true')
  form.set('pm', 'paytota_proxy')
  const response = await fetch(gateUrl(`/p/${purchaseId}/`), {
    method: 'POST',
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

export async function getPaytotaPurchase(id: string) {
  const response = await fetch(gateUrl(`/api/v1/purchases/${id}/`), {
    headers: { Authorization: `Bearer ${secret()}`, Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) {
    console.error('[unimart:paytota-get]', id, response.status)
    return null
  }
  return (await response.json()) as PaytotaPurchase
}

export function verifyPaytotaSignature(rawBody: string, signature: string | null) {
  const publicKey = process.env.PAYTOTA_WEBHOOK_PUBLIC_KEY
  if (!publicKey || !signature) return false
  try {
    const verifier = createVerify('SHA256')
    verifier.update(rawBody)
    verifier.end()
    return verifier.verify(publicKey.replace(/\\n/g, '\n'), signature, 'base64')
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

export function interpretPaytotaPurchase(payload: PaytotaPurchase | null | undefined): 'paid' | 'pending' | 'failed' {
  if (!payload) return 'pending'
  const event = String(payload.event_type ?? '')
  if (event === 'purchase.paid' || event === 'purchase.captured' || event === 'purchase.settled' || event === 'purchase.hold') return 'paid'
  if (event === 'purchase.payment_failure' || event === 'purchase.cancelled') return 'failed'

  // Root `status` is PurchaseStatus. Nested `purchase` is the cart and usually has no status.
  const status = String(payload.status ?? '')
  if (isPaytotaPaid(status)) return 'paid'
  if (isPaytotaFailed(status)) return 'failed'

  if (payload.marked_as_paid || payload.payment?.paid_on) return 'paid'
  const history = payload.status_history ?? []
  if (history.some((item) => isPaytotaPaid(item?.status))) return 'paid'

  return 'pending'
}
