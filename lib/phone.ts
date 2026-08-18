export const PHONE_COUNTRIES = [
  { iso: 'UG', name: 'Uganda', dial: '256' },
  { iso: 'KE', name: 'Kenya', dial: '254' },
  { iso: 'TZ', name: 'Tanzania', dial: '255' },
  { iso: 'RW', name: 'Rwanda', dial: '250' },
  { iso: 'SS', name: 'South Sudan', dial: '211' },
  { iso: 'NG', name: 'Nigeria', dial: '234' },
  { iso: 'GH', name: 'Ghana', dial: '233' },
  { iso: 'ZA', name: 'South Africa', dial: '27' },
  { iso: 'US', name: 'United States', dial: '1' },
  { iso: 'GB', name: 'United Kingdom', dial: '44' },
  { iso: 'IN', name: 'India', dial: '91' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '971' },
] as const

export const DEFAULT_PHONE_COUNTRY = 'UG'

export function nationalDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, 15)
}

export function toE164(dial: string, national: string) {
  const code = dial.replace(/\D/g, '')
  let local = national.replace(/\D/g, '')
  if (local.startsWith('0')) local = local.slice(1)
  if (!code || !local) return ''
  if (local.startsWith(code)) return `+${local}`
  return `+${code}${local}`
}

export function isValidE164(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value)
}

export function phoneBridgeEmail(e164: string) {
  const digits = e164.replace(/\D/g, '')
  return digits ? `p${digits}@phone.unimart.app` : ''
}

export function phoneDisplayName(e164: string) {
  const digits = e164.replace(/\D/g, '')
  const last = digits.slice(-4)
  return last ? `Member ${last}` : 'UniMart member'
}

export function maskPhone(e164: string) {
  const digits = e164.replace(/\D/g, '')
  if (digits.length < 6) return e164
  return `+${digits.slice(0, digits.length - 4).replace(/./g, '•')} ${digits.slice(-4)}`
}
