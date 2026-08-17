export type PaymentMethod = 'mobile_money' | 'card'
export type PaymentProvider = 'paytota' | 'dpo'

export function parsePaymentMethod(value: unknown): PaymentMethod | null {
  if (value === 'mobile_money' || value === 'card') return value
  return null
}

export function providerForMethod(method: PaymentMethod): PaymentProvider {
  return method === 'card' ? 'dpo' : 'paytota'
}

export function checkoutErrorMessage(method: PaymentMethod) {
  return method === 'card'
    ? 'Unable to start card checkout. Please try again.'
    : 'Unable to start mobile money checkout. Please try again.'
}
