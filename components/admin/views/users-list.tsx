'use client'

import Link from 'next/link'
import { BadgeCheck, ChevronLeft, ChevronRight, Download, MapPin, Shield, UserRound, UserX, Users } from 'lucide-react'
import { AdminButton, FilterBar, FilterSelect } from '@/components/admin/filter-bar'
import { InsightTile } from '@/components/admin/insight-tile'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { useListParams } from '@/components/admin/use-list-params'
import { useAdminResource } from '@/components/admin/use-resource'
import { Avatar } from '@/components/market/avatar'
import { EmptyState } from '@/components/admin/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { colorFromSeed, formatDate, timeAgo } from '@/lib/format'
import type { Paginated, Profile } from '@/lib/types'

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'student', label: 'Student' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'admin', label: 'Admin' },
]

const VERIFIED_OPTIONS = [
  { value: 'all', label: 'Any verification' },
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Unverified' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'banned', label: 'Banned' },
]

function campusLine(user: Profile) {
  return [user.campus, user.university].filter(Boolean).join(' · ') || 'Location not set'
}

function PersonCell({ user }: { user: Profile }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={user.display_name} color={colorFromSeed(user.id)} image={user.avatar_url} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-display text-sm font-bold text-[#243e39]">{user.display_name}</span>
          {user.verified ? <BadgeCheck size={14} className="shrink-0 text-[#4e786a]" /> : null}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-[#8b9994]">{campusLine(user)}</p>
      </div>
    </div>
  )
}

export function UsersListView() {
  const { page, pageSize, q, get, setParams, queryString } = useListParams()
  const role = get('role', 'all')
  const verified = get('verified', 'all')
  const status = get('status', 'all')
  const { data, error, loading } = useAdminResource(
    () => api.adminUsers(queryString),
    [queryString],
  )
  const result = data as Paginated<Profile> | null
  const rows = result?.data ?? []
  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const filtered = Boolean(q || role !== 'all' || verified !== 'all' || status !== 'all')
  const exportHref = `/api/admin/export?type=users${q ? `&q=${encodeURIComponent(q)}` : ''}`

  const insight = filtered ? 'Matching filters' : 'Everyone on UniMart'
  const restricted = status === 'suspended' || status === 'banned'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directory / Users"
        title="People"
        description="A live directory of students and operators. Verify accounts, assign roles, and open any profile for sanctions."
        actions={(
          <AdminButton href={exportHref}>
            <Download size={14} />
            Export CSV
          </AdminButton>
        )}
      />

      {error ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">{error}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightTile
          label="In this view"
          value={loading ? '—' : total.toLocaleString()}
          hint={insight}
          icon={Users}
          active={!filtered}
          onClick={() => setParams({ role: 'all', verified: 'all', status: 'all', q: '' })}
        />
        <InsightTile
          label="Verified"
          value={verified === 'true' && !loading ? total.toLocaleString() : '—'}
          hint="Student badge on"
          icon={BadgeCheck}
          accent="green"
          active={verified === 'true'}
          onClick={() => setParams({ verified: verified === 'true' ? 'all' : 'true' })}
        />
        <InsightTile
          label="Admins"
          value={role === 'admin' && !loading ? total.toLocaleString() : '—'}
          hint="Desk operators"
          icon={Shield}
          accent="amber"
          active={role === 'admin'}
          onClick={() => setParams({ role: role === 'admin' ? 'all' : 'admin' })}
        />
        <InsightTile
          label="Restricted"
          value={restricted && !loading ? total.toLocaleString() : '—'}
          hint="Suspended accounts"
          icon={UserX}
          accent="coral"
          active={status === 'suspended'}
          onClick={() => setParams({ status: status === 'suspended' ? 'all' : 'suspended' })}
        />
      </div>

      <div className="rounded-[24px] border border-[#e5eae7] bg-white p-3 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-4">
        <FilterBar search={q} onSearch={(value) => setParams({ q: value })} searchPlaceholder="Search name, area, or university">
          <FilterSelect value={role} onChange={(value) => setParams({ role: value })} options={ROLE_OPTIONS} />
          <FilterSelect value={verified} onChange={(value) => setParams({ verified: value })} options={VERIFIED_OPTIONS} />
          <FilterSelect value={status} onChange={(value) => setParams({ status: value })} options={STATUS_OPTIONS} />
        </FilterBar>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#edf1ef] px-4 py-3.5 sm:px-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Directory</p>
            <p className="mt-0.5 text-sm font-bold text-[#29463f]">
              {loading ? 'Loading people…' : `${total.toLocaleString()} ${total === 1 ? 'person' : 'people'}`}
            </p>
          </div>
          <p className="hidden text-[11px] text-[#8b9994] sm:block">Open a row for verification, roles, and sanctions</p>
        </div>

        <div className="divide-y divide-[#f0f4f2] md:hidden">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="size-10 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))
          ) : rows.map((user) => (
            <Link key={user.id} href={adminPaths.user(user.id)} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#f8fbf9]">
              <PersonCell user={user} />
              <div className="ml-auto flex shrink-0 flex-col items-end gap-1.5">
                <StatusBadge value={user.account_status ?? 'active'} />
                <StatusBadge value={user.role} />
              </div>
            </Link>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-[#edf1ef] bg-[#f8fbf9] text-[10px] uppercase tracking-[0.12em] text-[#8b9994]">
              <tr>
                <th className="px-5 py-3 font-bold">Person</th>
                <th className="px-4 py-3 font-bold">Location</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold">Account</th>
                <th className="px-4 py-3 font-bold">Joined</th>
                <th className="px-5 py-3 font-bold"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#f3f6f4]">
                    <td className="px-5 py-3.5"><div className="flex items-center gap-3"><Skeleton className="size-10 rounded-full" /><Skeleton className="h-4 w-40" /></div></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-3.5" />
                  </tr>
                ))
              ) : rows.map((user) => (
                <tr key={user.id} className="group border-b border-[#f3f6f4] last:border-0 transition hover:bg-[#f8fbf9]">
                  <td className="px-5 py-3.5">
                    <Link href={adminPaths.user(user.id)} className="block">
                      <PersonCell user={user} />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={adminPaths.user(user.id)} className="flex min-w-0 items-center gap-1.5 text-[#5f746c]">
                      <MapPin size={13} className="shrink-0 text-[#9aa7a2]" />
                      <span className="truncate">{campusLine(user)}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge value={user.role} /></td>
                  <td className="px-4 py-3.5"><StatusBadge value={user.account_status ?? 'active'} /></td>
                  <td className="px-4 py-3.5">
                    <Link href={adminPaths.user(user.id)} className="block">
                      <span className="block text-[13px] font-semibold text-[#3d5650]">{formatDate(user.created_at)}</span>
                      <span className="mt-0.5 block text-[11px] text-[#8b9994]">{timeAgo(user.created_at)}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={adminPaths.user(user.id)} className="flex size-8 items-center justify-center rounded-full text-[#c3d0cb] transition group-hover:bg-[#eef5f2] group-hover:text-[#315e55]" aria-label={`Open ${user.display_name}`}>
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !rows.length ? (
          <EmptyState
            icon={UserRound}
            title="No people match these filters"
            description="Try another area, role, or verification state. Export still includes the current search."
          />
        ) : null}

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
