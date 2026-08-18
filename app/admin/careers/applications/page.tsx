import { Suspense } from 'react'
import { ApplicationsListView } from '@/components/admin/views/applications-list'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminCareerApplicationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[420px] rounded-[24px]" />}>
      <ApplicationsListView />
    </Suspense>
  )
}
