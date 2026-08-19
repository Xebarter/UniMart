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
  checkout_url?: string
  purchase?: { status?: string }
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
    headers: { Authorization: `Bearer ${secret()}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) return null
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
  const value = (status ?? '').toLowerCase()
  return value === 'paid' || value === 'success' || value === 'completed' || value === 'captured'
}

export function isPaytotaFailed(status?: string) {
  const value = (status ?? '').toLowerCase()
  return value === 'error' || value === 'failed' || value === 'cancelled' || value === 'canceled' || value === 'expired'
}
