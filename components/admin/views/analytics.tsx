'use client'

import Link from 'next/link'
import { Activity, ChevronLeft, ChevronRight, Download, Fingerprint, MousePointerClick, ShoppingBag, TrendingUp, Users } from 'lucide-react'
import { EventsAreaChart } from '@/components/admin/charts'
import { AdminButton, FilterBar, FilterSelect } from '@/components/admin/filter-bar'
import { EmptyState } from '@/components/admin/empty-state'
import { KpiCard } from '@/components/admin/kpi-card'
import { useListParams } from '@/components/admin/use-list-params'
import { useAdminResource } from '@/components/admin/use-resource'
import { ListingPhoto } from '@/components/listing-photo'
import { Avatar } from '@/components/market/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { colorFromSeed, humanizeKey, timeAgo } from '@/lib/format'
import type { AdminAnalytics, AnalyticsEvent } from '@/lib/types'

const RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

export function AnalyticsView() {
  const { page, pageSize, q, get, setParams, queryString } = useListParams()
  const range = get('range', '30')
  const event = get('event', 'all')
  const { data, error, loading } = useAdminResource(() => api.adminAnalytics(queryString), [queryString])
  const result = data as AdminAnalytics | null
  const rows = result?.data ?? []
  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const peak = (result?.activity ?? []).reduce(
    (best, day) => (day.events > (best?.events ?? -1) ? day : best),
    result?.activity[0],
  )
  const exportQuery = new URLSearchParams()
  exportQuery.set('type', 'analytics')
  exportQuery.set('range', range)
  if (q) exportQuery.set('q', q)
  if (event !== 'all') exportQuery.set('event', event)

  const eventOptions = [
    { value: 'all', label: 'All events' },
    ...(result?.event_names ?? []).map((name) => ({ value: name, label: humanizeKey(name) })),
  ]
  if (event !== 'all' && !eventOptions.some((option) => option.value === event)) {
    eventOptions.push({ value: event, label: humanizeKey(event) })
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[28px] border border-[#dfe7e3] bg-gradient-to-br from-[#315e55] via-[#2a5049] to-[#1a3c36] px-5 py-7 text-white shadow-[0_20px_60px_rgba(36,62,57,0.18)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-[44%] border-[22px] border-[#47766b]/50 opacity-70" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(241,198,170,0.16),transparent_42%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c7ddd6]">Insights / Analytics</p>
            <h1 className="mt-2 font-display text-[1.85rem] font-bold leading-tight tracking-[-0.04em] sm:text-[2.35rem]">
              Product analytics
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#d4e4df] sm:text-[15px]">
              Event volume, attribution, and the listings and students driving marketplace activity.
            </p>
            {!loading && result ? (
              <div className="mt-5 flex flex-wrap gap-2.5">
                <HeroChip label="Events" value={result.total_events.toLocaleString()} />
                <HeroChip label="People" value={result.unique_users.toLocaleString()} />
                <HeroChip label="Listings touched" value={result.unique_listings.toLocaleString()} />
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect value={event} onChange={(value) => setParams({ event: value })} options={eventOptions} />
            <FilterSelect value={range} onChange={(value) => setParams({ range: value })} options={RANGE_OPTIONS} />
            <AdminButton href={`/api/admin/export?${exportQuery.toString()}`}>
              <Download size={14} />
              Export CSV
            </AdminButton>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm font-medium text-[#9a4f32]">{error}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !result ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[132px] rounded-[22px]" />)
        ) : (
          <>
            <KpiCard label="Total events" value={result.total_events.toLocaleString()} change={result.events_change} icon={MousePointerClick} accent="green" />
            <KpiCard label="Unique users" value={result.unique_users.toLocaleString()} change={result.unique_users_change} icon={Users} accent="coral" />
            <KpiCard label="Listings touched" value={result.unique_listings.toLocaleString()} hint={`${formatShare(result.listing_share)} of events attributed`} icon={ShoppingBag} accent="slate" />
            <KpiCard label="Event types" value={String(result.event_types)} hint={peak && peak.events ? `Peak ${peak.events.toLocaleString()} on ${peak.date}` : 'Distinct event names'} icon={Activity} accent="amber" />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Activity over time</CardTitle>
              <CardDescription>Daily event volume and unique signed-in users in this window.</CardDescription>
            </div>
            <span className="rounded-full bg-[#edf4f0] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#315e55]">
              {range} days
            </span>
          </CardHeader>
          <CardContent>
            {loading || !result ? (
              <Skeleton className="h-[280px] rounded-2xl" />
            ) : result.total_events === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="No events in this window"
                description="Client tracking will appear here once students start browsing, posting, and messaging."
              />
            ) : (
              <EventsAreaChart data={result.activity} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audience mix</CardTitle>
            <CardDescription>How much of this traffic we can attribute.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading || !result ? (
              <div className="space-y-4">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            ) : (
              <>
                <MixGroup
                  title="Identity"
                  rows={[
                    { label: 'Signed in', value: result.identified_share, tone: 'green' },
                    { label: 'Anonymous', value: roundShare(100 - result.identified_share), tone: 'coral' },
                  ]}
                />
                <MixGroup
                  title="Attribution"
                  rows={[
                    { label: 'Listing events', value: result.listing_share, tone: 'green' },
                    { label: 'General events', value: roundShare(100 - result.listing_share), tone: 'slate' },
                  ]}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top events</CardTitle>
            <CardDescription>Share of recorded product events in this range.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !result ? (
              <RankSkeleton />
            ) : !result.totals.length ? (
              <EmptyState icon={Fingerprint} title="No event types yet" description="Named events such as listing views will rank here." />
            ) : (
              <ol className="space-y-3">
                {result.totals.slice(0, 8).map((item, index) => (
                  <li key={item.event_name}>
                    <RankRow
                      rank={index + 1}
                      label={humanizeKey(item.event_name)}
                      meta={item.event_name}
                      value={item.count}
                      percent={item.percent}
                      max={result.totals[0]?.count ?? 1}
                    />
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top listings</CardTitle>
            <CardDescription>Listings that attracted the most attributed events.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !result ? (
              <RankSkeleton />
            ) : !result.top_listings.length ? (
              <EmptyState icon={ShoppingBag} title="No listing attribution" description="Events with a listing_id will surface the most viewed or engaged posts." />
            ) : (
              <ul className="space-y-3">
                {result.top_listings.map((listing, index) => (
                  <li key={listing.id}>
                    <Link href={adminPaths.listing(listing.id)} className="group flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-[#f7fbf9]">
                      <ListingPhoto listing={listing} alt="" className="size-12 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#243e39] group-hover:text-[#315e55]">{listing.title}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-[#8b9994]">#{index + 1} · {listing.count.toLocaleString()} events</p>
                      </div>
                      <span className="text-[11px] font-bold text-[#8b9994]">{shareOf(listing.count, result.total_events)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
        <div className="overflow-hidden rounded-[24px] border border-[#e2e9e5] bg-white shadow-[0_1px_0_rgba(36,62,57,0.03)]">
          <div className="border-b border-[#edf1ef] px-5 py-4 sm:px-5">
            <div className="mb-4">
              <h2 className="font-display text-base font-bold tracking-[-0.025em] text-[#243e39]">Event log</h2>
              <p className="mt-1 text-xs leading-5 text-[#8b9994]">Newest product events, with listing and user attribution.</p>
            </div>
            <FilterBar search={q} onSearch={(value) => setParams({ q: value })} searchPlaceholder="Search event name" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-[#edf1ef] text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b9994]">
                  <th className="px-5 py-3">Event</th>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-5 py-3 text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index} className="border-b border-[#f3f6f4]">
                      <td className="px-5 py-3.5"><Skeleton className="h-8 w-40 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-36" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-8 w-32 rounded-full" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="ml-auto h-4 w-20" /></td>
                    </tr>
                  ))
                ) : rows.map((row) => (
                  <EventRow key={row.id} event={row} />
                ))}
              </tbody>
            </table>
          </div>

          {!loading && !rows.length ? (
            <EmptyState
              icon={TrendingUp}
              title="No events match these filters"
              description="Try another range or event type. Tracking is recorded as students use the marketplace."
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

        <Card>
          <CardHeader>
            <CardTitle>Most active students</CardTitle>
            <CardDescription>Signed-in users generating the most events.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !result ? (
              <RankSkeleton />
            ) : !result.top_users.length ? (
              <EmptyState icon={Users} title="No identified users" description="Anonymous traffic still counts in totals. Signed-in activity will rank people here." />
            ) : (
              <ul className="space-y-3">
                {result.top_users.map((user, index) => (
                  <li key={user.id}>
                    <Link href={adminPaths.user(user.id)} className="group flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-[#f7fbf9]">
                      <Avatar name={user.display_name} image={user.avatar_url} color={colorFromSeed(user.id)} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#243e39] group-hover:text-[#315e55]">{user.display_name}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-[#8b9994]">#{index + 1} · {user.count.toLocaleString()} events</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EventRow({ event }: { event: AnalyticsEvent }) {
  const listing = event.listings
  const profile = event.profiles
  const chips = metadataChips(event.metadata)

  return (
    <tr className="border-b border-[#f3f6f4] last:border-0">
      <td className="px-5 py-3.5">
        <div className="flex flex-col gap-1.5">
          <span className="inline-flex w-fit rounded-full bg-[#edf4f0] px-2.5 py-1 text-[11px] font-bold text-[#315e55]">
            {humanizeKey(event.event_name)}
          </span>
          {chips.length ? (
            <p className="max-w-[220px] truncate text-[10px] font-medium text-[#a5afab]">{chips.join(' · ')}</p>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3.5">
        {listing ? (
          <Link href={adminPaths.listing(listing.id)} className="text-sm font-semibold text-[#315e55] hover:underline">
            {listing.title}
          </Link>
        ) : event.listing_id ? (
          <span className="text-xs font-medium text-[#8b9994]">Deleted listing</span>
        ) : (
          <span className="text-xs font-medium text-[#c0c8c4]">—</span>
        )}
      </td>
      <td className="px-4 py-3.5">
        {profile ? (
          <Link href={adminPaths.user(profile.id)} className="inline-flex items-center gap-2">
            <Avatar name={profile.display_name} image={profile.avatar_url} color={colorFromSeed(profile.id)} size="sm" />
            <span className="text-sm font-semibold text-[#29463f]">{profile.display_name}</span>
          </Link>
        ) : (
          <span className="text-xs font-medium text-[#8b9994]">Anonymous</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-right text-xs font-medium text-[#8b9994]">{timeAgo(event.created_at)}</td>
    </tr>
  )
}

function HeroChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 px-3.5 py-2.5 backdrop-blur-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#c7ddd6]">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold tracking-[-0.03em]">{value}</p>
    </div>
  )
}

function MixGroup({
  title,
  rows,
}: {
  title: string
  rows: { label: string; value: number; tone: 'green' | 'coral' | 'slate' }[]
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b9994]">{title}</p>
      <div className="mt-3 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#526861]">{row.label}</span>
              <span className="font-bold text-[#243e39]">{formatShare(row.value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#eef3f0]">
              <div
                className={`h-full rounded-full ${row.tone === 'coral' ? 'bg-[#d1734b]' : row.tone === 'slate' ? 'bg-[#8aa39a]' : 'bg-[#315e55]'}`}
                style={{ width: `${Math.min(100, Math.max(0, row.value))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RankRow({
  rank,
  label,
  meta,
  value,
  percent,
  max,
}: {
  rank: number
  label: string
  meta: string
  value: number
  percent: string
  max: number
}) {
  const width = max ? Math.max(8, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 text-right text-[11px] font-bold text-[#c0c8c4]">{rank}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-bold text-[#243e39]">{label}</p>
          <p className="shrink-0 text-[11px] font-bold text-[#526861]">{value.toLocaleString()} · {percent}</p>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eef3f0]">
          <div className="h-full rounded-full bg-[#315e55]" style={{ width: `${width}%` }} />
        </div>
        <p className="mt-1 truncate text-[10px] font-medium text-[#a5afab]">{meta}</p>
      </div>
    </div>
  )
}

function RankSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-12 rounded-2xl" />
      ))}
    </div>
  )
}

function metadataChips(metadata?: Record<string, unknown> | null) {
  if (!metadata) return []
  return Object.entries(metadata)
    .filter(([, value]) => value != null && value !== '')
    .slice(0, 2)
    .map(([key, value]) => `${humanizeKey(key)} ${typeof value === 'object' ? '' : String(value)}`.trim())
}

function formatShare(value: number) {
  const rounded = Number.isInteger(value) ? value : Math.round(value)
  return `${rounded}%`
}

function roundShare(value: number) {
  return Math.round(Math.max(0, value) * 10) / 10
}

function shareOf(part: number, total: number) {
  if (!total) return '0%'
  return `${Math.round((part / total) * 100)}%`
}
