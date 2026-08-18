'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Archive,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  DoorClosed,
  ExternalLink,
  FilePenLine,
  Inbox,
  PenLine,
  Star,
  Upload,
} from 'lucide-react'
import { AdminButton, FilterBar, FilterSelect } from '@/components/admin/filter-bar'
import { EmptyState } from '@/components/admin/empty-state'
import { InsightTile } from '@/components/admin/insight-tile'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { useListParams } from '@/components/admin/use-list-params'
import { useAdminResource } from '@/components/admin/use-resource'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { DEFAULT_CAREER_PAGE, employmentLabel, workplaceLabel } from '@/lib/careers'
import { formatDate, timeAgo } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import type { CareerPageSettings, JobRole, JobStatus, Paginated } from '@/lib/types'

type CareersPayload = Paginated<JobRole> & {
  counts?: { draft: number; published: number; closed: number; archived: number }
  applications?: { new: number; total: number }
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
]

export function CareersListView() {
  const { page, pageSize, q, get, setParams, queryString } = useListParams()
  const router = useRouter()
  const status = get('status', 'all')
  const { data, error, loading, reload } = useAdminResource(() => api.adminCareers(queryString), [queryString])
  const pageCopy = useAdminResource(() => api.adminCareerPage(), [])
  const result = data as CareersPayload | null
  const rows = result?.data ?? []
  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const counts = result?.counts
  const applications = result?.applications
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  async function setStatus(role: JobRole, next: JobStatus) {
    setActionBusyId(role.id)
    setActionError('')
    try {
      await api.updateCareer(role.id, { status: next })
      await reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update role.')
    } finally {
      setActionBusyId(null)
    }
  }

  function RowActions({ role }: { role: JobRole }) {
    const busy = actionBusyId === role.id
    return (
      <div className="flex items-center justify-end gap-1">
        {role.status === 'draft' || role.status === 'closed' ? (
          <button
            type="button"
            disabled={busy || Boolean(actionBusyId)}
            onClick={() => void setStatus(role, 'published')}
            className="flex size-8 items-center justify-center rounded-full text-[#c3d0cb] transition hover:bg-[#eef5f2] hover:text-[#315e55] disabled:opacity-40"
            aria-label={`Publish ${role.title}`}
          >
            <Upload size={14} />
          </button>
        ) : null}
        {role.status === 'published' ? (
          <Link
            href={marketPaths.career(role.slug)}
            target="_blank"
            rel="noreferrer"
            className="flex size-8 items-center justify-center rounded-full text-[#c3d0cb] transition hover:bg-[#eef5f2] hover:text-[#315e55]"
            aria-label={`View ${role.title} on Careers`}
          >
            <ExternalLink size={14} />
          </Link>
        ) : null}
        {role.status === 'published' ? (
          <button
            type="button"
            disabled={busy || Boolean(actionBusyId)}
            onClick={() => void setStatus(role, 'closed')}
            className="flex size-8 items-center justify-center rounded-full text-[#c3d0cb] transition hover:bg-[#fff5f0] hover:text-[#c86c48] disabled:opacity-40"
            aria-label={`Close ${role.title}`}
          >
            <DoorClosed size={14} />
          </button>
        ) : null}
        {role.status === 'published' || role.status === 'closed' ? (
          <button
            type="button"
            disabled={busy || Boolean(actionBusyId)}
            onClick={() => void setStatus(role, 'archived')}
            className="flex size-8 items-center justify-center rounded-full text-[#c3d0cb] transition hover:bg-[#fff5f0] hover:text-[#c86c48] disabled:opacity-40"
            aria-label={`Archive ${role.title}`}
          >
            <Archive size={14} />
          </button>
        ) : null}
        <Link
          href={adminPaths.career(role.id)}
          className="flex size-8 items-center justify-center rounded-full text-[#c3d0cb] transition hover:bg-[#eef5f2] hover:text-[#315e55]"
          aria-label={`Edit ${role.title}`}
        >
          <ChevronRight size={16} />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content / Careers"
        title="Careers"
        description="Publish open roles, close hiring when a search ends, and review applications from the public careers page."
        actions={(
          <>
            <AdminButton href={adminPaths.careerApplications} variant="secondary">
              <Inbox size={14} />
              Applications
              {applications?.new ? (
                <span className="rounded-full bg-[#fff5f0] px-1.5 py-0.5 text-[10px] font-bold text-[#c86c48]">{applications.new}</span>
              ) : null}
            </AdminButton>
            <AdminButton href={marketPaths.careers} variant="secondary">
              <ExternalLink size={14} />
              View page
            </AdminButton>
            <AdminButton href={adminPaths.careerNew} variant="primary">
              <PenLine size={14} />
              New role
            </AdminButton>
          </>
        )}
      />

      {error || actionError || pageCopy.error ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">{error || actionError || pageCopy.error}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightTile
          label="Open roles"
          value={loading ? '—' : (counts?.published ?? 0).toLocaleString()}
          hint="Live on /careers"
          icon={CircleCheck}
          accent="green"
          active={status === 'published'}
          onClick={() => setParams({ status: status === 'published' ? 'all' : 'published' })}
        />
        <InsightTile
          label="Drafts"
          value={loading ? '—' : (counts?.draft ?? 0).toLocaleString()}
          hint="Not yet public"
          icon={FilePenLine}
          accent="amber"
          active={status === 'draft'}
          onClick={() => setParams({ status: status === 'draft' ? 'all' : 'draft' })}
        />
        <InsightTile
          label="Closed"
          value={loading ? '—' : (counts?.closed ?? 0).toLocaleString()}
          hint="Search wrapped up"
          icon={DoorClosed}
          accent="coral"
          active={status === 'closed'}
          onClick={() => setParams({ status: status === 'closed' ? 'all' : 'closed' })}
        />
        <InsightTile
          label="Applications"
          value={loading ? '—' : (applications?.total ?? 0).toLocaleString()}
          hint={applications?.new ? `${applications.new} new to review` : 'Inbox is clear'}
          icon={Inbox}
          accent="slate"
          active={false}
          onClick={() => router.push(adminPaths.careerApplications)}
        />
      </div>

      <CareerPageCopyCard
        data={pageCopy.data?.data ?? null}
        loading={pageCopy.loading}
        onSaved={() => void pageCopy.reload()}
      />

      <div className="rounded-[24px] border border-[#e5eae7] bg-white p-3 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-4">
        <FilterBar search={q} onSearch={(value) => setParams({ q: value })} searchPlaceholder="Search title, department, or location">
          <FilterSelect value={status} onChange={(value) => setParams({ status: value })} options={STATUS_OPTIONS} />
        </FilterBar>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#edf1ef] px-4 py-3.5 sm:px-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Roles</p>
            <p className="mt-0.5 text-sm font-bold text-[#29463f]">
              {loading ? 'Loading roles…' : `${total.toLocaleString()} ${total === 1 ? 'role' : 'roles'}`}
            </p>
          </div>
          <p className="hidden text-[11px] text-[#8b9994] sm:block">Publish a role to list it on the public careers page</p>
        </div>

        <div className="divide-y divide-[#f0f4f2] md:hidden">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="size-12 rounded-[14px]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))
          ) : rows.map((role) => (
            <div key={role.id} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#f8fbf9]">
              <Link href={adminPaths.career(role.id)} className="flex min-w-0 flex-1 items-center gap-3">
                <RoleCell role={role} />
                <div className="ml-auto flex shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge value={role.status} />
                </div>
              </Link>
              <RowActions role={role} />
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-[#edf1ef] bg-[#f8fbf9] text-[10px] uppercase tracking-[0.12em] text-[#8b9994]">
              <tr>
                <th className="px-5 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold">Team</th>
                <th className="px-4 py-3 font-bold">Type</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Updated</th>
                <th className="px-5 py-3 font-bold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#f3f6f4]">
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-44" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-3.5" />
                  </tr>
                ))
              ) : rows.map((role) => (
                <tr key={role.id} className="group border-b border-[#f3f6f4] last:border-0 transition hover:bg-[#f8fbf9]">
                  <td className="px-5 py-3.5">
                    <Link href={adminPaths.career(role.id)} className="block">
                      <RoleCell role={role} />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[13px] font-semibold text-[#5f746c]">{role.department}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[13px] font-semibold text-[#5f746c]">
                      {employmentLabel(role.employment_type)} · {workplaceLabel(role.workplace)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge value={role.status} /></td>
                  <td className="px-4 py-3.5">
                    <span className="block text-[13px] font-semibold text-[#3d5650]">{formatDate(role.updated_at ?? role.created_at)}</span>
                    <span className="mt-0.5 block text-[11px] text-[#8b9994]">{timeAgo(role.updated_at ?? role.created_at)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <RowActions role={role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !rows.length ? (
          <EmptyState
            icon={Briefcase}
            title="No roles match these filters"
            description="Clear filters or draft a new opening. Published roles appear on /careers."
            action={(
              <div className="flex flex-wrap items-center justify-center gap-2">
                <AdminButton onClick={() => setParams({ status: 'all', q: '' })}>
                  Clear filters
                </AdminButton>
                <AdminButton href={adminPaths.careerNew} variant="primary">
                  <PenLine size={14} />
                  New role
                </AdminButton>
              </div>
            )}
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

function RoleCell({ role }: { role: JobRole }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[#edf6f1] text-[#315e55]">
        {role.featured ? <Star size={16} /> : <Briefcase size={16} />}
      </span>
      <div className="min-w-0">
        <span className="block truncate font-display text-sm font-bold text-[#243e39]">{role.title}</span>
        <p className="mt-0.5 truncate text-[11px] text-[#8b9994]">{role.location} · /{role.slug}</p>
      </div>
    </div>
  )
}

function CareerPageCopyCard({
  data,
  loading,
  onSaved,
}: {
  data: CareerPageSettings | null
  loading: boolean
  onSaved: () => void
}) {
  const [form, setForm] = useState<CareerPageSettings>(DEFAULT_CAREER_PAGE)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  async function save() {
    setBusy(true)
    setMessage('')
    try {
      const result = await api.updateCareerPage({
        headline: form.headline,
        intro: form.intro,
        apply_email: form.apply_email,
        accept_general: form.accept_general,
      })
      setForm(result.data)
      setMessage('Page copy saved.')
      onSaved()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to save page copy.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Public page</p>
          <h2 className="mt-1 font-display text-lg font-bold text-[#243e39]">Hero copy</h2>
          <p className="mt-1 text-sm text-[#748780]">Headline, intro, and general-application settings for /careers.</p>
        </div>
        <AdminButton onClick={() => void save()} variant="primary" disabled={busy || loading}>
          {busy ? 'Saving…' : 'Save copy'}
        </AdminButton>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="career-headline">Headline</Label>
          <Input
            id="career-headline"
            value={form.headline}
            disabled={loading}
            onChange={(event) => setForm((current) => ({ ...current, headline: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="career-email">Applications email</Label>
          <Input
            id="career-email"
            value={form.apply_email}
            disabled={loading}
            onChange={(event) => setForm((current) => ({ ...current, apply_email: event.target.value }))}
          />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="career-intro">Intro</Label>
          <Textarea
            id="career-intro"
            value={form.intro}
            disabled={loading}
            onChange={(event) => setForm((current) => ({ ...current, intro: event.target.value }))}
          />
        </div>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#526861]">
        <input
          type="checkbox"
          checked={form.accept_general}
          disabled={loading}
          onChange={(event) => setForm((current) => ({ ...current, accept_general: event.target.checked }))}
          className="size-4 accent-[#315e55]"
        />
        Accept general applications when there is no matching role
      </label>
      {message ? <p className="mt-3 text-xs font-semibold text-[#638076]">{message}</p> : null}
    </div>
  )
}
