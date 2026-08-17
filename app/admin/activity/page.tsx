import { Suspense } from 'react'
import { ActivityView } from '@/components/admin/views/activity'
import { Skeleton } from '@/components/ui/skeleton'

function ActivityFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[116px] rounded-[22px]" />)}
      </div>
      <Skeleton className="h-16 rounded-[24px]" />
      <Skeleton className="h-[420px] rounded-[24px]" />
    </div>
  )
}

export default function AdminActivityPage() {
  return (
    <Suspense fallback={<ActivityFallback />}>
      <ActivityView />
    </Suspense>
  )
}
