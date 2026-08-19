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
      fallback="pending"
      title="Confirming your card payment"
      body="Stay on this page. We are checking the card network — this usually takes a few seconds."
    />
  )
}
