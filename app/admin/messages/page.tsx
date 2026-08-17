import { Suspense } from 'react'
import { MessagesListView } from '@/components/admin/views/messages-list'
import { Skeleton } from '@/components/ui/skeleton'

function MessagesFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-52" />
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

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<MessagesFallback />}>
      <MessagesListView />
    </Suspense>
  )
}
