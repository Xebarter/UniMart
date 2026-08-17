import { createVerify } from 'node:crypto'

const BASE_URL = process.env.PAYTOTA_BASE_URL || 'https://gate.paytota.com'

function secret() {
  const key = process.env.PAYTOTA_SECRET_KEY
  if (!key) throw new Error('Mobile money checkout is not configured.')
  return key
}

export type PaytotaPurchase = {
  id: string
  status?: string
  checkout_url?: string
  purchase?: { status?: string }
}

export async function createPaytotaPurchase(input: {
  email: string
  amount: number
  reference: string
  description: string
  successUrl: string
  failureUrl: string
  cancelUrl: string
}) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/api/v1/purchases/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client: { email: input.email, country: 'UG' },
      purchase: {
        currency: 'UGX',
        products: [{ name: input.description, price: input.amount }],
      },
      reference: input.reference,
      brand_id: process.env.PAYTOTA_BRAND_ID,
      skip_capture: false,
      success_redirect: input.successUrl,
      failure_redirect: input.failureUrl,
      cancel_redirect: input.cancelUrl,
      payment_method_whitelist: ['airtel', 'mtnmomo'],
    }),
  })
  const data = (await response.json().catch(() => ({}))) as PaytotaPurchase & { detail?: string; error?: string }
  if (!response.ok || !data.id) {
    throw new Error('Unable to start mobile money checkout.')
  }
  return data
}

export async function getPaytotaPurchase(id: string) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/api/v1/purchases/${id}/`, {
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
