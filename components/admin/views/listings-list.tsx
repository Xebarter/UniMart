'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, Download, Eye, MapPin, ShoppingBag, Sparkles } from 'lucide-react'
import { AdminButton, FilterBar, FilterSelect } from '@/components/admin/filter-bar'
import { EmptyState } from '@/components/admin/empty-state'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { useListParams } from '@/components/admin/use-list-params'
import { useAdminResource } from '@/components/admin/use-resource'
import { ListingPhoto } from '@/components/listing-photo'
import { Avatar } from '@/components/market/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { colorFromSeed, formatUGX, isFeatured, listingPhotos, rentPeriodSuffix, timeAgo } from '@/lib/format'
import type { Listing, Paginated } from '@/lib/types'

export function ListingsListView() {
  const { page, pageSize, q, get, setParams, queryString } = useListParams()
  const status = get('status', 'all')
  const category = get('category', 'all')
  const featured = get('featured', 'all')
  const params = new URLSearchParams(queryString)
  if (featured === 'yes') params.set('featured', '1')
  else params.delete('featured')
  const { data, error, loading } = useAdminResource(
    () => api.adminListings(params.toString()),
    [queryString, featured],
  )
  const result = data as Paginated<Listing> | null
  const rows = result?.data ?? []
  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const exportQuery = new URLSearchParams()
  if (status !== 'all') exportQuery.set('status', status)
  if (q) exportQuery.set('q', q)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Listings"
        title="Catalog"
        description="Review photos, sellers, and listing status across the marketplace."
        actions={(
          <AdminButton href={`/api/admin/export?type=listings${exportQuery.toString() ? `&${exportQuery}` : ''}`}>
            <Download size={14} className="mr-1.5" />
            Export CSV
          </AdminButton>
        )}
      />
      {error ? <p className="text-sm text-[#d1734b]">{error}</p> : null}

      <div className="overflow-hidden rounded-[24px] border border-[#e2e9e5] bg-white shadow-[0_1px_0_rgba(36,62,57,0.03)]">
        <div className="border-b border-[#edf1ef] bg-[#fbfcfb] px-4 py-4 sm:px-5">
          <FilterBar search={q} onSearch={(value) => setParams({ q: value })} searchPlaceholder="Search title, location, or description">
            <FilterSelect value={status} onChange={(value) => setParams({ status: value })} options={[{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending' }, { value: 'draft', label: 'Draft' }, { value: 'sold', label: 'Sold' }, { value: 'archived', label: 'Archived' }, { value: 'removed', label: 'Removed' }]} />
            <FilterSelect value={category} onChange={(value) => setParams({ category: value })} options={[{ value: 'all', label: 'All categories' }, { value: 'Products', label: 'Products' }, { value: 'Services', label: 'Services' }, { value: 'Rentals', label: 'Rentals' }, { value: 'Gigs', label: 'Gigs' }]} />
            <FilterSelect value={featured} onChange={(value) => setParams({ featured: value })} options={[{ value: 'all', label: 'Any boost' }, { value: 'yes', label: 'Featured now' }]} />
          </FilterBar>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-[#edf1ef] text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b9994]">
                <th className="px-5 py-3">Listing</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Activity</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 7 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#f3f6f4]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-4">
                        <Skeleton className="size-[72px] rounded-2xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><Skeleton className="h-8 w-36 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="ml-auto h-4 w-20" /></td>
                  </tr>
                ))
              ) : rows.map((listing) => (
                <ListingRow key={listing.id} listing={listing} />
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !rows.length ? (
          <EmptyState
            icon={ShoppingBag}
            title="No listings match these filters"
            description="Try another status, category, or search term. New posts will appear here as soon as students publish them."
          />
        ) : null}

        <div className="flex items-center justify-between border-t border-[#edf1ef] px-5 py-3.5 text-xs text-[#8b9994]">
          <p>Showing <span className="font-bold text-[#526861]">{from}–{to}</span> of <span className="font-bold text-[#526861]">{total.toLocaleString()}</span></p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setParams({ page: page - 1 }, false)} className="flex size-8 items-center justify-center rounded-lg border border-[#dfe7e3] bg-white disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <span className="min-w-[3.5rem] text-center font-bold text-[#526861]">{page} / {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => setParams({ page: page + 1 }, false)} className="flex size-8 items-center justify-center rounded-lg border border-[#dfe7e3] bg-white disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ListingRow({ listing }: { listing: Listing }) {
  const photos = listingPhotos(listing)
  const photoCount = (listing.listing_media ?? []).length
  const featured = isFeatured(listing)
  const period = rentPeriodSuffix(listing.rent_period)
  const seller = listing.profiles

  return (
    <tr className="group border-b border-[#f3f6f4] last:border-0 hover:bg-[#f8fbf9]">
      <td className="px-5 py-3.5">
        <Link href={adminPaths.listing(listing.id)} className="flex items-center gap-4">
          <span className="relative shrink-0">
            <ListingPhoto
              listing={listing}
              alt={listing.title}
              className="size-[72px] rounded-2xl shadow-[inset_0_0_0_1px_rgba(36,62,57,0.06)] transition group-hover:shadow-[0_8px_20px_rgba(36,62,57,0.12)]"
            />
            {photoCount > 1 ? (
              <span className="absolute bottom-1.5 right-1.5 rounded-md bg-[#102824]/80 px-1.5 py-0.5 text-[9px] font-bold text-white">
                {photoCount}
              </span>
            ) : null}
            {!photos[0]?.startsWith('http') ? (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[#ffffffcc]">
                <ShoppingBag size={18} />
              </span>
            ) : null}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-[15px] font-bold tracking-[-0.02em] text-[#243e39] group-hover:text-[#315e55]">
              {listing.title}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8b9994]">
              <span className="font-semibold text-[#638076]">{listing.category}</span>
              {listing.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} />
                  <span className="max-w-[180px] truncate">{listing.location}</span>
                </span>
              ) : null}
            </span>
          </span>
        </Link>
      </td>
      <td className="px-4 py-3.5">
        {seller ? (
          <Link href={adminPaths.user(seller.id)} className="flex items-center gap-2.5">
            <Avatar name={seller.display_name} color={colorFromSeed(seller.id)} image={seller.avatar_url} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#29463f]">{seller.display_name}</span>
              <span className="block truncate text-[11px] text-[#8b9994]">{seller.campus || seller.university || 'Member'}</span>
            </span>
          </Link>
        ) : (
          <span className="text-sm text-[#8b9994]">—</span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <p className="font-display text-sm font-bold tracking-[-0.02em] text-[#243e39]">{formatUGX(Number(listing.price), listing.currency)}</p>
        {period ? <p className="mt-0.5 text-[11px] text-[#8b9994]">{period}</p> : null}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex flex-col items-start gap-1.5">
          <StatusBadge value={listing.status} />
          {featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff2ec] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#c86c48]">
              <Sparkles size={10} /> Featured
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-5 py-3.5 text-right">
        <p className="inline-flex items-center justify-end gap-1 text-[12px] font-semibold text-[#526861]">
          <Eye size={12} className="text-[#9aa7a2]" />
          {listing.view_count.toLocaleString()}
        </p>
        <p className="mt-1 text-[11px] text-[#8b9994]">{timeAgo(listing.created_at)}</p>
      </td>
    </tr>
  )
}
