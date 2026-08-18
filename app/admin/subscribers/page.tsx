import { Suspense } from 'react'
import { SubscribersListView } from '@/components/admin/views/subscribers-list'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminSubscribersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[420px] rounded-[24px]" />}>
      <SubscribersListView />
    </Suspense>
  )
}
