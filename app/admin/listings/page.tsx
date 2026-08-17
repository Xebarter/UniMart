import { Suspense } from 'react'
import { ListingsListView } from '@/components/admin/views/listings-list'

export default function AdminListingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#8b9994]">Loading listings…</p>}>
      <ListingsListView />
    </Suspense>
  )
}
