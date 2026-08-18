'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { AdminButton, FilterBar, FilterSelect } from '@/components/admin/filter-bar'
import { EmptyState } from '@/components/admin/empty-state'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { useListParams } from '@/components/admin/use-list-params'
import { useAdminResource } from '@/components/admin/use-resource'
import { Skeleton } from '@/components/ui/skeleton'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { formatDateTime, timeAgo } from '@/lib/format'
import type { JobApplication, JobRole, Paginated } from '@/lib/types'

type Payload = Paginated<JobApplication> & {
  counts?: { new: number; reviewing: number; shortlisted: number; rejected: number; hired: number }
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
]

export function ApplicationsListView() {
  const { page, pageSize, q, get, setParams, queryString } = useListParams()
  const status = get('status', 'all')
  const roleId = get('role_id', 'all')
  const { data, error, loading } = useAdminResource(() => api.adminJobApplications(queryString), [queryString])
  const roles = useAdminResource(() => api.adminCareers('pageSize=100'), [])
  const result = data as Payload | null
  const rows = result?.data ?? []
  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const roleOptions = [
    { value: 'all', label: 'All roles' },
    { value: 'general', label: 'General applications' },
    ...((roles.data?.data ?? []) as JobRole[]).map((role) => ({ value: role.id, label: role.title })),
  ]

  function onRoleChange(value: string) {
    if (value === 'general') setParams({ role_id: '', kind: 'general' })
    else setParams({ role_id: value, kind: '' })
  }

  const roleFilter = get('kind') === 'general' ? 'general' : roleId

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content / Careers"
        title="Applications"
        description="Review people who applied from /careers. Move them through review, shortlist, hire, or reject."
        actions={<AdminButton href={adminPaths.careers}>Back to roles</AdminButton>}
      />

      {error ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">{error}</div>
      ) : null}

      <div className="rounded-[24px] border border-[#e5eae7] bg-white p-3 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-4">
        <FilterBar search={q} onSearch={(value) => setParams({ q: value })} searchPlaceholder="Search name, email, or note">
          <FilterSelect value={status} onChange={(value) => setParams({ status: value })} options={STATUS_OPTIONS} />
          <FilterSelect value={roleFilter} onChange={onRoleChange} options={roleOptions} />
        </FilterBar>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-[#edf1ef] bg-[#f8fbf9] text-[10px] uppercase tracking-[0.12em] text-[#8b9994]">
              <tr>
                <th className="px-5 py-3 font-bold">Applicant</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold">Location</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#f3f6f4]">
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-28" /></td>
                  </tr>
                ))
              ) : rows.map((row) => (
                <tr key={row.id} className="border-b border-[#f3f6f4] last:border-0 transition hover:bg-[#f8fbf9]">
                  <td className="px-5 py-3.5">
                    <Link href={adminPaths.careerApplication(row.id)} className="block">
                      <span className="block font-display text-sm font-bold text-[#243e39]">{row.name}</span>
                      <span className="mt-0.5 block text-[11px] text-[#8b9994]">{row.email}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-[13px] font-semibold text-[#5f746c]">
                    {row.job_roles?.title ?? 'General application'}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-[#5f746c]">{row.location || '—'}</td>
                  <td className="px-4 py-3.5"><StatusBadge value={row.status} /></td>
                  <td className="px-5 py-3.5">
                    <span className="block text-[13px] font-semibold text-[#3d5650]">{formatDateTime(row.created_at)}</span>
                    <span className="mt-0.5 block text-[11px] text-[#8b9994]">{timeAgo(row.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-[#f0f4f2] md:hidden">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="px-4 py-3.5"><Skeleton className="h-10 w-full" /></div>
            ))
          ) : rows.map((row) => (
            <Link key={row.id} href={adminPaths.careerApplication(row.id)} className="block px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-[#243e39]">{row.name}</p>
                  <p className="mt-0.5 text-[11px] text-[#8b9994]">{row.job_roles?.title ?? 'General application'}</p>
                </div>
                <StatusBadge value={row.status} />
              </div>
            </Link>
          ))}
        </div>

        {!loading && !rows.length ? (
          <EmptyState
            icon={Inbox}
            title="No applications yet"
            description="When someone applies from the public careers page, they will show up here."
            action={<AdminButton href={adminPaths.careers}>Back to roles</AdminButton>}
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
