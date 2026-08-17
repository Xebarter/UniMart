import { Suspense } from 'react'
import { ShopsListView } from '@/components/admin/views/shops-list'
import { Skeleton } from '@/components/ui/skeleton'

function ShopsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-[108px] rounded-[22px]" />
        ))}
      </div>
      <Skeleton className="h-16 rounded-[24px]" />
      <Skeleton className="h-[420px] rounded-[24px]" />
    </div>
  )
}

export default function AdminShopsPage() {
  return (
    <Suspense fallback={<ShopsLoading />}>
      <ShopsListView />
    </Suspense>
  )
}
