import { PaymentResult } from '@/components/payment-result'

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string }>
}) {
  const { payment_id: paymentId } = await searchParams
  return (
    <PaymentResult
      paymentId={paymentId}
      fallback="paid"
      title="Payment received"
      body="Your listing is now featured for the next 7 days."
    />
  )
}
