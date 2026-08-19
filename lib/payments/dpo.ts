const API_URL = process.env.DPO_API_URL || 'https://secure.3gdirectpay.com/API/v6/'
const DEFAULT_PAY_URL = 'https://secure.3gdirectpay.com/pay.asp?ID='

function hostedPayUrl() {
  const configured = process.env.DPO_PAYMENT_URL?.trim() || ''
  if (!configured || /payv3\.php/i.test(configured)) return DEFAULT_PAY_URL
  return configured
}

function companyToken() {
  return process.env.DPO_COMPANY_TOKEN || process.env.HOSTED_CHECKOUT_COMPANY_TOKEN || ''
}

function serviceType() {
  return process.env.DPO_SERVICE_TYPE || process.env.HOSTED_CHECKOUT_SERVICE_TYPE || '111455'
}

export function xmlValue(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'))
  return match?.[1]?.trim() ?? ''
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

async function dpoRequest(xml: string) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml; charset=utf-8', Accept: 'application/xml' },
    body: xml,
  })
  return await response.text()
}

export type DpoVerifyStatus = 'paid' | 'pending' | 'failed' | 'cancelled' | 'expired'

export function interpretDpoVerify(result?: string): DpoVerifyStatus {
  switch ((result ?? '').trim()) {
    case '000':
    case '001':
      return 'paid'
    case '002':
    case '003':
    case '005':
    case '007':
    case '900':
      return 'pending'
    case '901':
      return 'failed'
    case '903':
      return 'expired'
    case '904':
      return 'cancelled'
    default:
      return 'pending'
  }
}

export async function createDpoToken(input: {
  amount: number
  reference: string
  description: string
  email: string
  firstName: string
  lastName: string
  redirectUrl: string
  backUrl: string
  phone?: string
}) {
  const token = companyToken()
  if (!token) throw new Error('Card checkout is not configured.')
  const now = new Date()
  const serviceDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const phone = (input.phone ?? '').replace(/\D/g, '')
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${escapeXml(token)}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${input.amount.toFixed(2)}</PaymentAmount>
    <PaymentCurrency>UGX</PaymentCurrency>
    <CompanyRef>${escapeXml(input.reference)}</CompanyRef>
    <RedirectURL>${escapeXml(input.redirectUrl)}</RedirectURL>
    <BackURL>${escapeXml(input.backUrl)}</BackURL>
    <CompanyRefUnique>1</CompanyRefUnique>
    <DefaultPayment>CC</DefaultPayment>
    <PTL>30</PTL>
    <customerFirstName>${escapeXml(input.firstName)}</customerFirstName>
    <customerLastName>${escapeXml(input.lastName)}</customerLastName>
    <customerEmail>${escapeXml(input.email)}</customerEmail>
    ${phone ? `<customerPhone>${escapeXml(phone)}</customerPhone>` : ''}
    <customerCountry>UG</customerCountry>
  </Transaction>
  <Services>
    <Service>
      <ServiceType>${escapeXml(serviceType())}</ServiceType>
      <ServiceDescription>${escapeXml(input.description)}</ServiceDescription>
      <ServiceDate>${serviceDate}</ServiceDate>
    </Service>
  </Services>
</API3G>`
  const body = await dpoRequest(xml)
  const result = xmlValue(body, 'Result')
  const transToken = xmlValue(body, 'TransToken') || xmlValue(body, 'TransactionToken')
  const transRef = xmlValue(body, 'TransRef')
  if (result !== '000' || !transToken) {
    const explanation = xmlValue(body, 'ResultExplanation') || 'Unable to start card checkout.'
    throw new Error(explanation)
  }
  return {
    transToken,
    transRef,
    checkoutUrl: `${hostedPayUrl()}${transToken}`,
    raw: body,
  }
}

export async function verifyDpoToken(transToken: string) {
  const token = companyToken()
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${escapeXml(token)}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${escapeXml(transToken)}</TransactionToken>
  <TransToken>${escapeXml(transToken)}</TransToken>
</API3G>`
  const body = await dpoRequest(xml)
  const result = xmlValue(body, 'Result')
  return {
    result,
    status: interpretDpoVerify(result),
    paid: interpretDpoVerify(result) === 'paid',
    explanation: xmlValue(body, 'ResultExplanation'),
    amount: xmlValue(body, 'TransactionAmount'),
    companyRef: xmlValue(body, 'CompanyRef'),
    transRef: xmlValue(body, 'TransRef') || xmlValue(body, 'AccRef'),
    raw: body,
  }
}

function flattenRecord(value: unknown, prefix = ''): Record<string, string> {
  if (value == null) return {}
  if (typeof value !== 'object') return prefix ? { [prefix]: String(value) } : {}
  const out: Record<string, string> = {}
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const next = prefix ? `${prefix}.${key}` : key
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) Object.assign(out, flattenRecord(nested, next))
    else if (nested != null) out[next] = String(nested)
  }
  return out
}

export async function parseDpoCallbackFields(request: Request) {
  const url = new URL(request.url)
  const fields: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    fields[key] = value
  })
  if (request.method === 'GET') return fields

  const contentType = request.headers.get('content-type') || ''
  const raw = await request.text()
  if (!raw.trim()) return fields

  if (contentType.includes('json') || raw.trim().startsWith('{')) {
    try {
      Object.assign(fields, flattenRecord(JSON.parse(raw)))
    } catch {
      // Ignore malformed JSON and keep query fields.
    }
    return fields
  }

  if (contentType.includes('xml') || raw.trim().startsWith('<')) {
    for (const tag of ['TransactionToken', 'TransToken', 'TransID', 'CompanyRef', 'TransRef', 'Result', 'merchantOrderId', 'transactionId']) {
      const value = xmlValue(raw, tag)
      if (value) fields[tag] = value
    }
    return fields
  }

  new URLSearchParams(raw).forEach((value, key) => {
    fields[key] = value
  })
  return fields
}

export function dpoPaymentIdFromFields(fields: Record<string, string>) {
  return fields.payment_id || fields.CompanyRef || fields.merchantOrderId || fields.CompanyRefID || ''
}

export function dpoTokenFromFields(fields: Record<string, string>) {
  return fields.TransactionToken || fields.TransToken || fields.TransID || ''
}

type DpoPaymentRow = {
  id: string
  amount: number
  currency?: string | null
  provider_payment_id: string | null
  provider_reference: string | null
  raw?: unknown
}

type DpoAdmin = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown>
  from: (table: string) => {
    update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<unknown> }
  }
}

function mergeRaw(payment: DpoPaymentRow, extra: Record<string, unknown>) {
  return { ...(typeof payment.raw === 'object' && payment.raw ? payment.raw : {}), ...extra }
}

function amountMatches(payment: DpoPaymentRow, charged: string) {
  if (!charged) return true
  const value = Number(charged)
  if (!Number.isFinite(value)) return true
  return Math.abs(value - Number(payment.amount)) < 0.5
}

export async function reconcileDpoPayment(admin: DpoAdmin, payment: DpoPaymentRow, extraRaw: Record<string, unknown> = {}) {
  if (!payment.provider_payment_id) return { status: 'pending' as const }
  const verified = await verifyDpoToken(payment.provider_payment_id)
  const raw = mergeRaw(payment, { ...extraRaw, verify: verified.raw, result: verified.result, explanation: verified.explanation })
  const providerReference = verified.transRef || payment.provider_reference
  if (verified.status === 'paid') {
    if (verified.companyRef && verified.companyRef !== payment.id) {
      await admin.from('payments').update({ raw }).eq('id', payment.id)
      return { status: 'pending' as const }
    }
    if (!amountMatches(payment, verified.amount)) {
      await admin.from('payments').update({ raw }).eq('id', payment.id)
      return { status: 'pending' as const }
    }
    await admin.rpc('fulfill_payment', { p_payment_id: payment.id })
    await admin.from('payments').update({ provider_reference: providerReference, raw }).eq('id', payment.id)
    return { status: 'paid' as const }
  }
  if (verified.status === 'pending') {
    await admin.from('payments').update({ raw }).eq('id', payment.id)
    return { status: 'pending' as const }
  }
  await admin.from('payments').update({
    status: verified.status,
    provider_reference: providerReference,
    raw,
  }).eq('id', payment.id)
  return { status: verified.status }
}
