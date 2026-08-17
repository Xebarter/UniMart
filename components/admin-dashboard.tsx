'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Download,
  Ellipsis,
  LayoutDashboard,
  MoreHorizontal,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { api } from '@/lib/api-client'
import { formatUGX, timeAgo } from '@/lib/format'
import type { AdminStats, Listing, Profile, Report } from '@/lib/types'

const adminNav = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Listings', icon: ShoppingBag },
  { label: 'Users', icon: Users },
  { label: 'Reports', icon: CircleHelp },
  { label: 'Articles', icon: BookOpen },
] as const

function formatChange(value: number) {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value}%`
}

export function AdminDashboard({ name }: { name: string }) {
  const [section, setSection] = useState<(typeof adminNav)[number]['label']>('Overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [error, setError] = useState('')

  async function load() {
    try {
      const [statsResult, reportsResult, listingsResult, usersResult] = await Promise.all([
        api.adminStats(),
        api.adminReports(),
        api.listings('status=all&limit=80'),
        api.adminUsers(),
      ])
      setStats(statsResult.data)
      setReports(reportsResult.data)
      setListings(listingsResult.data)
      setUsers(usersResult.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin data.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const cards = useMemo(() => {
    if (!stats) return []
    return [
      ['Total users', stats.total_users.toLocaleString(), formatChange(stats.users_change), Users],
      ['Active listings', stats.active_listings.toLocaleString(), formatChange(stats.listings_change), ShoppingBag],
      ['Pending reports', String(stats.pending_reports), formatChange(stats.reports_change), CircleHelp],
      ['Gross volume', formatUGX(stats.gross_volume), formatChange(stats.volume_change), TrendingUp],
    ] as const
  }, [stats])

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#f5f7f6]">
      <div className="flex min-h-[calc(100vh-72px)]">
        <aside className="hidden w-[210px] border-r border-[#dfe6e2] bg-[#243e39] p-5 md:block">
          <BrandLogo size={36} className="mb-6" />
          <p className="mb-8 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9ab8ae]">Admin console</p>
          {adminNav.map(({ label, icon: Icon }) => (
            <button key={label} onClick={() => setSection(label)} className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold ${section === label ? 'bg-white/12 text-white' : 'text-[#abc1ba] hover:bg-white/8'}`}>
              <Icon size={16} />{label}
            </button>
          ))}
          <div className="mt-10 border-t border-white/10 pt-5">
            <p className="px-3 text-[10px] leading-5 text-[#89a59c]">UniMart operations<br />v1.0 · Kampala</p>
          </div>
        </aside>
        <main className="flex-1 p-5 sm:p-8">
          <div className="mx-auto max-w-[1080px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">Superadmin / {section}</p>
                <h1 className="mt-2 font-display text-2xl font-bold tracking-[-0.035em] text-[#29463f]">Good morning, {name.split(' ')[0] || 'Admin'}</h1>
                <p className="mt-1 text-xs text-[#8b9994]">Here&apos;s what&apos;s happening across UniMart today.</p>
              </div>
              <a href="/api/admin/stats" className="hidden items-center gap-2 rounded-lg border border-[#dfe7e3] bg-white px-3 py-2 text-xs font-bold text-[#638076] sm:flex">
                <Download size={14} /> Export report
              </a>
            </div>
            {error && <p className="mt-4 text-sm text-[#d1734b]">{error}</p>}

            {section === 'Overview' && (
              <>
                <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {cards.map(([label, value, change, Icon]) => (
                    <div key={label} className="rounded-xl border border-[#e2e9e5] bg-white p-4">
                      <div className="flex items-center justify-between text-[#87a096]">
                        <span className="text-[11px] font-semibold">{label}</span>
                        <span className="flex size-7 items-center justify-center rounded-lg bg-[#edf4f0]"><Icon size={14} /></span>
                      </div>
                      <p className="mt-4 font-display text-2xl font-bold tracking-[-0.03em] text-[#29463f]">{value}</p>
                      <p className={`mt-1 text-[10px] font-bold ${change.startsWith('-') ? 'text-[#d1734b]' : 'text-[#5b927d]'}`}>{change} <span className="font-medium text-[#a5afab]">vs last month</span></p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
                  <div className="rounded-xl border border-[#e2e9e5] bg-white p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-display text-base font-bold text-[#29463f]">Activity overview</h2>
                        <p className="mt-1 text-[11px] text-[#9aa7a2]">Listings created, last 30 days</p>
                      </div>
                      <button className="flex items-center gap-1 text-[10px] font-bold text-[#789189]">Last 30 days <ChevronDown size={13} /></button>
                    </div>
                    <div className="mt-6 flex h-[150px] items-end gap-1.5 border-b border-l border-[#edf0ee] px-2 pb-0">
                      {(stats?.activity ?? Array.from({ length: 30 }, () => 20)).map((h, i) => (
                        <span key={i} className={`flex-1 rounded-t-sm ${i > 23 ? 'bg-[#315e55]' : 'bg-[#c6dbd3]'}`} style={{ height: `${Math.max(8, h)}px` }} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#e2e9e5] bg-white p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-base font-bold text-[#29463f]">Listings by type</h2>
                      <MoreHorizontal size={17} className="text-[#9aa7a2]" />
                    </div>
                    <div className="mt-6 space-y-4">
                      {(stats?.by_category ?? []).map((item, index) => (
                        <div key={item.label}>
                          <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-[#71847c]"><span>{item.label}</span><span>{item.percent}</span></div>
                          <div className="h-2 rounded-full bg-[#edf1ef]"><div className="h-2 rounded-full" style={{ width: item.percent, background: ['#315e55', '#d1734b', '#9b7eb2', '#c6a34d'][index] }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <ModerationQueue reports={reports} onResolved={load} />
              </>
            )}

            {section === 'Listings' && (
              <AdminTable
                rows={listings.map((item) => [item.title, item.category, formatUGX(Number(item.price)), item.status, item.id])}
                headers={['Title', 'Category', 'Price', 'Status', '']}
                action={async (id, current) => {
                  const next = current === 'active' ? 'removed' : 'active'
                  await api.moderateListing(id, next)
                  await load()
                }}
              />
            )}

            {section === 'Users' && (
              <AdminTable
                rows={users.map((user) => [user.display_name, user.university ?? '—', user.role, user.verified ? 'Verified' : 'Unverified', user.id])}
                headers={['Name', 'University', 'Role', 'Status', '']}
                actionLabel="Verify"
                action={async (id) => {
                  await api.updateUser(id, { verified: true })
                  await load()
                }}
              />
            )}

            {section === 'Reports' && <ModerationQueue reports={reports} onResolved={load} />}

            {section === 'Articles' && (
              <div className="mt-6 rounded-xl border border-[#e2e9e5] bg-white p-5 text-sm text-[#71847c]">
                Magazine stories are managed from published articles. New drafts stay private until an admin publishes them.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function ModerationQueue({ reports, onResolved }: { reports: Report[]; onResolved: () => void }) {
  const open = reports.filter((report) => report.status === 'open' || report.status === 'reviewing')
  return (
    <div className="mt-5 rounded-xl border border-[#e2e9e5] bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-[#29463f]">Moderation queue</h2>
          <p className="mt-1 text-[11px] text-[#9aa7a2]">Review recent reports and flags</p>
        </div>
      </div>
      <div className="mt-4 divide-y divide-[#eff2f0]">
        {(open.length ? open : reports).slice(0, 8).map((report) => (
          <div key={report.id} className="flex items-center gap-3 py-3">
            <span className="hidden rounded-md bg-[#fff2ec] px-2 py-1 text-[10px] font-bold text-[#c86c48] sm:block">#{report.id.slice(0, 8)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#526861]">{report.reason}</p>
              <p className="mt-0.5 truncate text-[10px] text-[#9aa7a2]">{report.listings?.title ?? 'User report'} · {timeAgo(report.created_at)}</p>
            </div>
            {report.status === 'resolved' || report.status === 'dismissed' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#5b927d]"><CheckCircle2 size={14} /> {report.status}</span>
            ) : (
              <button onClick={async () => { await api.resolveReport(report.id, 'resolved'); onResolved() }} className="rounded-lg border border-[#dfe7e3] px-3 py-1.5 text-[10px] font-bold text-[#638076] hover:bg-[#f1f6f3]">Resolve</button>
            )}
            <button className="text-[#a3afaa]"><Ellipsis size={17} /></button>
          </div>
        ))}
        {!reports.length && <p className="py-6 text-center text-xs text-[#9aa7a2]">No reports yet.</p>}
      </div>
    </div>
  )
}

function AdminTable({ rows, headers, action, actionLabel = 'Toggle' }: { rows: string[][]; headers: string[]; action: (id: string, current: string) => Promise<void>; actionLabel?: string }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-[#e2e9e5] bg-white">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-[#edf1ef] text-[10px] uppercase tracking-wider text-[#8b9994]">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-bold">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[4]} className="border-b border-[#f3f6f4] text-[#526861]">
              {row.slice(0, 4).map((cell) => <td key={cell} className="px-4 py-3 font-medium">{cell}</td>)}
              <td className="px-4 py-3 text-right">
                <button onClick={() => action(row[4], row[3])} className="rounded-lg border border-[#dfe7e3] px-3 py-1.5 text-[10px] font-bold text-[#638076]">{actionLabel}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="p-6 text-center text-xs text-[#9aa7a2]">Nothing to show yet.</p>}
    </div>
  )
}
