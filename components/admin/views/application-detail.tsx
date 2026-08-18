'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { useAdminResource } from '@/components/admin/use-resource'
import { Textarea } from '@/components/ui/textarea'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { formatDateTime } from '@/lib/format'
import { JOB_APPLICATION_STATUSES, type JobApplication, type JobApplicationStatus } from '@/lib/types'

const STATUSES = JOB_APPLICATION_STATUSES

export function ApplicationDetailView() {
  const { id } = useParams<{ id: string }>()
  const { data, error, loading, reload } = useAdminResource(() => api.adminJobApplication(id), [id])
  const application = (data as { data: JobApplication } | null)?.data
  const [notes, setNotes] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function save(patch: Record<string, unknown>) {
    setBusy(true)
    setMessage('')
    try {
      await api.updateJobApplication(id, patch)
      await reload()
      setMessage('Saved.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to update application.')
    } finally {
      setBusy(false)
    }
  }

  if (loading && !application) return <p className="text-sm text-[#8b9994]">Loading application…</p>
  if (error) return <p className="text-sm text-[#d1734b]">{error}</p>
  if (!application) return null

  const noteValue = notes ?? application.notes

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content / Careers"
        title={application.name}
        description={application.email}
        actions={(
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                disabled={busy || application.status === status}
                onClick={() => void save({ status })}
                className="rounded-xl border border-[#dfe7e3] bg-white px-3 py-2 text-xs font-bold capitalize text-[#638076] disabled:opacity-40"
              >
                {status}
              </button>
            ))}
          </div>
        )}
      />

      {message ? <p className="text-sm text-[#638076]">{message}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Meta label="Status" value={<StatusBadge value={application.status} />} />
        <Meta
          label="Role"
          value={
            application.job_roles ? (
              <Link href={adminPaths.career(application.job_roles.id)} className="font-semibold text-[#315e55]">
                {application.job_roles.title}
              </Link>
            ) : 'General application'
          }
        />
        <Meta label="Submitted" value={formatDateTime(application.created_at)} />
        <Meta label="Location" value={application.location || '—'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
          <h2 className="font-display text-base font-bold text-[#243e39]">Contact</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Email"><a href={`mailto:${application.email}`} className="font-semibold text-[#315e55]">{application.email}</a></Row>
            <Row label="Phone">{application.phone || '—'}</Row>
            <Row label="Portfolio">{linkOrDash(application.portfolio_url)}</Row>
            <Row label="LinkedIn">{linkOrDash(application.linkedin_url)}</Row>
            <Row label="Resume">{linkOrDash(application.resume_url)}</Row>
          </dl>
        </section>
        <section className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
          <h2 className="font-display text-base font-bold text-[#243e39]">Internal notes</h2>
          <Textarea className="mt-4" value={noteValue} onChange={(event) => setNotes(event.target.value)} />
          <button
            type="button"
            disabled={busy}
            onClick={() => void save({ notes: noteValue, status: application.status as JobApplicationStatus })}
            className="mt-3 inline-flex h-10 items-center rounded-xl bg-[#315e55] px-4 text-xs font-bold text-white hover:bg-[#294f48] disabled:opacity-60"
          >
            Save notes
          </button>
        </section>
      </div>

      <section className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
        <h2 className="font-display text-base font-bold text-[#243e39]">Cover letter</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#5f746c]">{application.cover_letter || 'No note was included.'}</p>
      </section>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-[#e5eae7] bg-white px-4 py-4 shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">{label}</p>
      <div className="mt-2 text-sm font-semibold text-[#243e39]">{value}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[#8b9994]">{label}</dt>
      <dd className="text-right font-medium text-[#243e39]">{children}</dd>
    </div>
  )
}

function linkOrDash(value?: string | null) {
  if (!value) return '—'
  return (
    <a href={value} target="_blank" rel="noreferrer" className="break-all font-semibold text-[#315e55]">
      Open
    </a>
  )
}
