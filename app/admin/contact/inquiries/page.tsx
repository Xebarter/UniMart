import { Suspense } from 'react'
import { ContactInquiriesListView } from '@/components/admin/views/contact-inquiries-list'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminContactInquiriesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[420px] rounded-[24px]" />}>
      <ContactInquiriesListView />
    </Suspense>
  )
}
