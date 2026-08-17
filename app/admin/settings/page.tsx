import { Suspense } from 'react'
import { SettingsView } from '@/components/admin/views/settings'
import { Skeleton } from '@/components/ui/skeleton'

function SettingsLoading() {
  return (
    <div className="space-y-7">
      <Skeleton className="h-[220px] rounded-[28px]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[108px] rounded-[22px]" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-[280px] rounded-[22px]" />
        <Skeleton className="h-[280px] rounded-[22px]" />
      </div>
      <Skeleton className="h-[320px] rounded-[22px]" />
    </div>
  )
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsView />
    </Suspense>
  )
}
