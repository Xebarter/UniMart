'use client'

import Link from 'next/link'
import { BadgeCheck, ChevronLeft, ChevronRight, CircleCheck, ExternalLink, MapPin, ShieldOff, Store } from 'lucide-react'
import { AdminButton, FilterBar, FilterSelect } from '@/components/admin/filter-bar'
import { EmptyState } from '@/components/admin/empty-state'
import { InsightTile } from '@/components/admin/insight-tile'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { useListParams } from '@/components/admin/use-list-params'
import { useAdminResource } from '@/components/admin/use-resource'
import { Avatar } from '@/components/market/avatar'
import { ShopCover } from '@/components/market/shop-cover'
import { Skeleton } from '@/components/ui/skeleton'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { colorFromSeed, formatDate, timeAgo } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import type { Paginated, Shop } from '@/lib/types'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
]

function campusLine(shop: Shop) {
  const owner = shop.profiles
  return [owner?.campus, owner?.university].filter(Boolean).join(' · ') || 'Location not set'
}

function ShopCard({ shop }: { shop: Shop }) {
  const owner = shop.profiles
  return (
    <article className="group overflow-hidden rounded-[22px] border border-[#e5eae7] bg-white shadow-[0_8px_24px_rgba(36,62,57,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(36,62,57,0.08)]">
      <Link href={adminPaths.shop(shop.id)} className="block">
        <div className="relative">
          <ShopCover shop={shop} className="aspect-[16/9] w-full" />
          <span className="absolute left-3 top-3 z-[1]">
            <StatusBadge value={shop.status ?? 'active'} />
          </span>
        </div>
        <div className="p-4">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5">
                <h3 className="truncate font-display text-sm font-bold text-[#243e39] group-hover:text-[#315e55]">{shop.name}</h3>
                {owner?.verified ? <BadgeCheck size={14} className="shrink-0 text-[#4e786a]" /> : null}
              </div>
              <p className="mt-0.5 truncate text-[11px] text-[#8b9994]">/{shop.slug}</p>
            </div>
          </div>
          {shop.bio ? <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#748780]">{shop.bio}</p> : null}
          <div className="mt-3 flex min-w-0 items-center gap-2 border-t border-[#eef3f0] pt-3">
            <Avatar name={owner?.display_name} color={colorFromSeed(shop.owner_id)} image={owner?.avatar_url} small />
            <span className="min-w-0 truncate text-[11px] font-medium text-[#5f746c]">{owner?.display_name ?? 'Owner'}</span>
            <span className="ml-auto inline-flex min-w-0 max-w-[45%] items-center gap-1 text-[10px] text-[#8b9994]">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{campusLine(shop)}</span>
            </span>
          </div>
        </div>
      </Link>
      <div className="flex items-center justify-between border-t border-[#eef3f0] px-4 py-2.5">
        <span className="text-[11px] text-[#8b9994]">{formatDate(shop.created_at)} · {timeAgo(shop.created_at)}</span>
        <Link
          href={marketPaths.shopPublic(shop.slug)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#315e55] hover:underline"
        >
          Storefront <ExternalLink size={11} />
        </Link>
      </div>
    </article>
  )
}

export function ShopsListView() {
  const { page, pageSize, q, get, setParams, queryString } = useListParams()
  const status = get('status', 'all')
  const { data, error, loading } = useAdminResource(() => api.adminShops(queryString), [queryString])
  const result = data as Paginated<Shop> | null
  const rows = result?.data ?? []
  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const filtered = Boolean(q || status !== 'all')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketplace / Shops"
        title="Storefronts"
        description="Review the covers owners uploaded, shop identity, and storefront status before taking moderation action."
        actions={(
          <AdminButton href={marketPaths.home} variant="secondary">
            <ExternalLink size={14} />
            View marketplace
          </AdminButton>
        )}
      />

      {error ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">{error}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <InsightTile
          label="In this view"
          value={loading ? '—' : total.toLocaleString()}
          hint={filtered ? 'Matching filters' : 'All storefronts'}
          icon={Store}
          active={!filtered}
          onClick={() => setParams({ status: 'all', q: '' })}
        />
        <InsightTile
          label="Active"
          value={status === 'active' && !loading ? total.toLocaleString() : '—'}
          hint="Live storefronts"
          icon={CircleCheck}
          accent="green"
          active={status === 'active'}
          onClick={() => setParams({ status: status === 'active' ? 'all' : 'active' })}
        />
        <InsightTile
          label="Disabled"
          value={status === 'disabled' && !loading ? total.toLocaleString() : '—'}
          hint="Taken down by ops"
          icon={ShieldOff}
          accent="coral"
          active={status === 'disabled'}
          onClick={() => setParams({ status: status === 'disabled' ? 'all' : 'disabled' })}
        />
      </div>

      <div className="rounded-[24px] border border-[#e5eae7] bg-white p-3 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-4">
        <FilterBar search={q} onSearch={(value) => setParams({ q: value })} searchPlaceholder="Search shop name, slug, or bio">
          <FilterSelect value={status} onChange={(value) => setParams({ status: value })} options={STATUS_OPTIONS} />
        </FilterBar>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#edf1ef] px-4 py-3.5 sm:px-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Directory</p>
            <p className="mt-0.5 text-sm font-bold text-[#29463f]">
              {loading ? 'Loading shops…' : `${total.toLocaleString()} ${total === 1 ? 'shop' : 'shops'}`}
            </p>
          </div>
          <p className="hidden text-[11px] text-[#8b9994] sm:block">Covers are the images owners set on their shop</p>
        </div>

        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[22px] border border-[#e5eae7]">
                  <Skeleton className="aspect-[16/9] w-full rounded-none" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : rows.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
            </div>
          ) : (
            <EmptyState
              icon={Store}
              title="No shops match these filters"
              description="Try another search term or clear the status filter to browse every storefront on UniMart."
              action={(
                <AdminButton onClick={() => setParams({ status: 'all', q: '' })}>
                  Clear filters
                </AdminButton>
              )}
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#edf1ef] px-4 py-3 text-xs text-[#8b9994] sm:px-5">
          <p>Showing {from}–{to} of {total.toLocaleString()}</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setParams({ page: page - 1 }, false)} className="rounded-lg border border-[#dfe7e3] p-1.5 text-[#526861] transition hover:bg-[#f7fbf9] disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <span className="font-bold text-[#526861]">{page} / {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => setParams({ page: page + 1 }, false)} className="rounded-lg border border-[#dfe7e3] p-1.5 text-[#526861] transition hover:bg-[#f7fbf9] disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
