import { Suspense } from 'react'
import { ReportsListView } from '@/components/admin/views/reports-list'

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#8b9994]">Loading reports…</p>}>
      <ReportsListView />
    </Suspense>
  )
}
