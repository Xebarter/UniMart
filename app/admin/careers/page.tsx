import { Suspense } from 'react'
import { CareersListView } from '@/components/admin/views/careers-list'
import { Skeleton } from '@/components/ui/skeleton'

function CareersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[108px] rounded-[22px]" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-[24px]" />
      <Skeleton className="h-[420px] rounded-[24px]" />
    </div>
  )
}

export default function AdminCareersPage() {
  return (
    <Suspense fallback={<CareersLoading />}>
      <CareersListView />
    </Suspense>
  )
}
