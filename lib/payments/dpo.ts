const API_URL = process.env.DPO_API_URL || 'https://secure.3gdirectpay.com/API/v6/'
const PAY_URL = process.env.DPO_PAYMENT_URL || 'https://secure.3gdirectpay.com/payv3.php?ID='

function companyToken() {
  return process.env.DPO_COMPANY_TOKEN || process.env.HOSTED_CHECKOUT_COMPANY_TOKEN || ''
}

function serviceType() {
  return process.env.DPO_SERVICE_TYPE || process.env.HOSTED_CHECKOUT_SERVICE_TYPE || '111455'
}

function xmlValue(xml: string, tag: string) {
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

export async function createDpoToken(input: {
  amount: number
  reference: string
  description: string
  email: string
  firstName: string
  lastName: string
  redirectUrl: string
  backUrl: string
}) {
  const token = companyToken()
  if (!token) throw new Error('Card checkout is not configured.')
  const now = new Date()
  const serviceDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
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
  if (result !== '000' || !transToken) {
    throw new Error('Unable to start card checkout.')
  }
  return { transToken, checkoutUrl: `${PAY_URL}${transToken}`, raw: body }
}

export async function verifyDpoToken(transToken: string) {
  const token = companyToken()
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${escapeXml(token)}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${escapeXml(transToken)}</TransactionToken>
</API3G>`
  const body = await dpoRequest(xml)
  const result = xmlValue(body, 'Result')
  return {
    result,
    paid: result === '000' || result === '001',
    explanation: xmlValue(body, 'ResultExplanation'),
    amount: xmlValue(body, 'TransactionAmount'),
    companyRef: xmlValue(body, 'CompanyRef'),
    raw: body,
  }
}
