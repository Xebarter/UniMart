import { Suspense } from 'react'
import { AnalyticsView } from '@/components/admin/views/analytics'

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#8b9994]">Loading analytics…</p>}>
      <AnalyticsView />
    </Suspense>
  )
}
