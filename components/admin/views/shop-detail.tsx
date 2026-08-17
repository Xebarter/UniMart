'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { ShopCover } from '@/components/market/shop-cover'
import { useAdminResource } from '@/components/admin/use-resource'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { formatDateTime } from '@/lib/format'
import type { Listing, Shop } from '@/lib/types'

type Shop360 = { data: Shop; listings: Listing[] }

export function ShopDetailView() {
  const { id } = useParams<{ id: string }>()
  const { data, error, loading, reload } = useAdminResource(() => api.adminShop(id), [id])
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const shop = (data as Shop360 | null)?.data
  const listings = (data as Shop360 | null)?.listings ?? []

  if (loading && !shop) return <p className="text-sm text-[#8b9994]">Loading shop…</p>
  if (error) return <p className="text-sm text-[#d1734b]">{error}</p>
  if (!shop) return null

  const disabled = shop.status === 'disabled'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketplace / Shop"
        title={shop.name}
        description={shop.bio || `/${shop.slug}`}
        actions={(
          <button type="button" onClick={() => setConfirm(true)} className={`rounded-xl px-3 py-2 text-xs font-bold ${disabled ? 'bg-[#315e55] text-white' : 'bg-[#b42318] text-white'}`}>
            {disabled ? 'Reinstate shop' : 'Disable shop'}
          </button>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Meta label="Status" value={<StatusBadge value={shop.status ?? 'active'} />} />
        <Meta label="Owner" value={shop.profiles ? <Link href={adminPaths.user(shop.owner_id)} className="text-[#315e55]">{shop.profiles.display_name}</Link> : '—'} />
        <Meta label="Followers" value={String(shop.follower_count ?? 0)} />
        <Meta label="Opened" value={formatDateTime(shop.created_at)} />
      </div>
      <ShopCover shop={shop} className="h-48 w-full rounded-[22px] sm:h-56" />
      <Card>
        <CardHeader><CardTitle>Listings</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {listings.length ? listings.map((listing) => (
            <Link key={listing.id} href={adminPaths.listing(listing.id)} className="flex justify-between text-sm">
              <span>{listing.title}</span>
              <StatusBadge value={listing.status} />
            </Link>
          )) : <p className="text-xs text-[#8b9994]">This shop has no listings.</p>}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirm}
        title={disabled ? 'Reinstate this shop?' : 'Disable this shop?'}
        description={disabled ? 'The storefront will be visible again. Listings stay in their current status.' : 'The shop will be disabled and its active listings archived.'}
        confirmLabel={disabled ? 'Reinstate' : 'Disable'}
        tone={disabled ? 'default' : 'danger'}
        loading={busy}
        onClose={() => setConfirm(false)}
        onConfirm={async () => {
          setBusy(true)
          try {
            await api.updateShopStatus(id, disabled ? 'active' : 'disabled')
            await reload()
            setConfirm(false)
          } finally {
            setBusy(false)
          }
        }}
      />
    </div>
  )
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e2e9e5] bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">{label}</p>
      <div className="mt-2 text-sm font-semibold text-[#29463f]">{value}</div>
    </div>
  )
}
