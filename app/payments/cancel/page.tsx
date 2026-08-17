import { PaymentResult } from '@/components/payment-result'

export default async function PaymentCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string }>
}) {
  const { payment_id: paymentId } = await searchParams
  return (
    <PaymentResult
      paymentId={paymentId}
      fallback="cancelled"
      title="Payment cancelled"
      body="No charge was made. You can try promoting the listing again anytime."
    />
  )
}
