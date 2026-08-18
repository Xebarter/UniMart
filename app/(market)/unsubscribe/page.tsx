import type { Metadata } from 'next'
import { Suspense } from 'react'
import { UnsubscribeView } from '@/components/market/unsubscribe-view'

export const metadata: Metadata = {
  title: 'Unsubscribe — UniMart',
  description: 'Stop UniMart email updates for deals, features, and seller tips.',
  robots: { index: false, follow: false },
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[720px] px-5 py-16 text-sm text-[#748780]">Loading…</div>}>
      <UnsubscribeView />
    </Suspense>
  )
}
