import type { Metadata } from 'next'
import { Suspense } from 'react'
import { UnsubscribeView } from '@/components/market/unsubscribe-view'

export const metadata: Metadata = {
  title: 'Unsubscribe — UniMart',
  description: 'Stop UniMart newsletter emails. Account, payment, and safety messages may still be sent when needed.',
  robots: { index: false, follow: false },
}

function UnsubscribeFallback() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <div className="h-8 w-36 rounded-lg bg-[#eef3f0]" />
      <div className="mt-7 h-52 rounded-[28px] bg-[#315e55]" />
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="h-72 rounded-[28px] border border-[#e5eae7] bg-white" />
        <div className="h-72 rounded-[28px] border border-[#e5eae7] bg-white" />
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<UnsubscribeFallback />}>
      <UnsubscribeView />
    </Suspense>
  )
}
