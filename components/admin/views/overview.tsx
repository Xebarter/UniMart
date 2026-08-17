'use client'

import Link from 'next/link'
import { ArrowUpRight, CircleHelp, Download, ShoppingBag, Sparkles, Store, TrendingUp, Users } from 'lucide-react'
import { ActivityAreaChart, CategoryBarChart } from '@/components/admin/charts'
import { AdminButton, FilterSelect } from '@/components/admin/filter-bar'
import { KpiCard } from '@/components/admin/kpi-card'
import { StatusBadge } from '@/components/admin/status-badge'
import { useOperator } from '@/components/admin/operator-context'
import { useAdminResource } from '@/components/admin/use-resource'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { formatUGX, timeAgo } from '@/lib/format'
import type { AdminStats } from '@/lib/types'
import { useState } from 'react'

export function OverviewView() {
  const operator = useOperator()
  const [range, setRange] = useState('30')
  const { data, error, loading } = useAdminResource(() => api.adminStats(range).then((result) => result.data), [range])
  const stats = data as AdminStats | null
  const firstName = operator.name.split(' ')[0] || 'Admin'

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[28px] border border-[#dfe7e3] bg-gradient-to-br from-[#315e55] via-[#2a5049] to-[#1a3c36] px-5 py-7 text-white shadow-[0_20px_60px_rgba(36,62,57,0.18)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-[44%] border-[22px] border-[#47766b]/50 opacity-70" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(241,198,170,0.16),transparent_42%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c7ddd6]">Operations overview</p>
            <h1 className="mt-2 font-display text-[1.85rem] font-bold leading-tight tracking-[-0.04em] sm:text-[2.35rem]">
              Good to see you, {firstName}.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#d4e4df] sm:text-[15px]">
              Live marketplace health, moderation queues, and revenue across UniMart campus operations.
            </p>
            {!loading && stats ? (
              <div className="mt-5 flex flex-wrap gap-2.5">
                <HeroChip label="Users" value={stats.total_users.toLocaleString()} />
                <HeroChip label="Listings" value={stats.active_listings.toLocaleString()} />
                <HeroChip label="Open reports" value={String(stats.pending_reports)} highlight={stats.pending_reports > 0} />
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              value={range}
              onChange={setRange}
              options={[
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
              ]}
            />
            <AdminButton href="/api/admin/export?type=payments">
              <span className="inline-flex items-center gap-1.5"><Download size={14} /> Export CSV</span>
            </AdminButton>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm font-medium text-[#9a4f32]">{error}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !stats ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[132px] rounded-[22px]" />)
        ) : (
          <>
            <KpiCard label="Total users" value={stats.total_users.toLocaleString()} change={stats.users_change} icon={Users} accent="green" />
            <KpiCard label="Active listings" value={stats.active_listings.toLocaleString()} change={stats.listings_change} icon={ShoppingBag} accent="slate" />
            <KpiCard label="Open reports" value={String(stats.pending_reports)} change={stats.reports_change} icon={CircleHelp} accent="coral" />
            <KpiCard label="Gross volume" value={formatUGX(stats.gross_volume)} change={stats.volume_change} icon={TrendingUp} accent="amber" />
          </>
        )}
      </div>

      {!loading && stats ? (
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard label="Shops" value={stats.total_shops.toLocaleString()} hint="Live storefronts on campus" icon={Store} accent="green" />
          <KpiCard label="Featured now" value={stats.featured_listings.toLocaleString()} hint="Boosted listings in feed" icon={Sparkles} accent="coral" />
          <KpiCard label="Paid features" value={stats.paid_features.toLocaleString()} hint="Completed listing boosts" icon={TrendingUp} accent="amber" />
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Marketplace activity</CardTitle>
              <p className="text-xs text-[#8b9994]">New listings and user sign-ups over the selected range</p>
            </div>
            <span className="rounded-full bg-[#edf4f0] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#315e55]">
              {range} days
            </span>
          </CardHeader>
          <CardContent className="pt-0">
            {stats ? <ActivityAreaChart data={stats.activity} /> : <Skeleton className="h-[260px] rounded-2xl" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Listings by category</CardTitle>
            <p className="text-xs text-[#8b9994]">Distribution across marketplace types</p>
          </CardHeader>
          <CardContent className="pt-0">
            {stats ? <CategoryBarChart data={stats.by_category} /> : <Skeleton className="h-[260px] rounded-2xl" />}
          </CardContent>
        </Card>
      </div>

      {stats ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <QueueCard title="Moderation queue" href={adminPaths.reports} tone="coral" items={stats.queues.reports.map((item) => ({ id: item.id, title: item.reason, meta: timeAgo(item.created_at), status: item.status, href: adminPaths.report(item.id) }))} />
          <QueueCard title="Listings to review" href={adminPaths.listings} tone="green" items={stats.queues.listings.map((item) => ({ id: item.id, title: item.title, meta: item.category, status: item.status, href: adminPaths.listing(item.id) }))} />
          <QueueCard title="Recent payments" href={adminPaths.payments} tone="amber" items={stats.queues.payments.map((item) => ({ id: item.id, title: formatUGX(item.amount, item.currency), meta: item.purpose.replace('_', ' '), status: item.status, href: adminPaths.payment(item.id) }))} />
        </div>
      ) : null}
    </div>
  )
}

function HeroChip({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border px-3.5 py-2.5 backdrop-blur-sm ${highlight ? 'border-[#f3c8ad]/40 bg-[#fff5f0]/12' : 'border-white/12 bg-white/10'}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#c7ddd6]">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold tracking-[-0.03em]">{value}</p>
    </div>
  )
}

function QueueCard({
  title,
  href,
  tone,
  items,
}: {
  title: string
  href: string
  tone: 'green' | 'coral' | 'amber'
  items: { id: string; title: string; meta: string; status: string; href: string }[]
}) {
  const toneClass = {
    green: 'from-[#eef6f3] to-white text-[#315e55]',
    coral: 'from-[#fff5f0] to-white text-[#d1734b]',
    amber: 'from-[#fff9ed] to-white text-[#b8860b]',
  }[tone]

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        <Link href={href} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#315e55] transition hover:text-[#d1734b]">
          View all <ArrowUpRight size={13} />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {items.length ? items.map((item, index) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-transparent px-2 py-2 transition hover:border-[#e8eeeb] hover:bg-[#f8fbf9]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[11px] font-bold ring-1 ring-black/5 ${toneClass}`}>
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#29463f] group-hover:text-[#315e55]">{item.title}</p>
                <p className="truncate text-[11px] text-[#8b9994]">{item.meta}</p>
              </div>
            </div>
            <StatusBadge value={item.status} />
          </Link>
        )) : (
          <div className="rounded-2xl border border-dashed border-[#dfe7e3] bg-[#f8fbf9] px-4 py-8 text-center">
            <p className="text-sm font-semibold text-[#526861]">Queue is clear</p>
            <p className="mt-1 text-xs text-[#8b9994]">Nothing needs attention right now.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
