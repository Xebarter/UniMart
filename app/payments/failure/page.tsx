import { PaymentResult } from '@/components/payment-result'

export default async function PaymentFailurePage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string }>
}) {
  const { payment_id: paymentId } = await searchParams
  return (
    <PaymentResult
      paymentId={paymentId}
      fallback="failed"
      title="Payment did not go through"
      body="Please try again or choose another payment method."
    />
  )
}
