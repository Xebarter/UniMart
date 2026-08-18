'use client'

import type { ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { useAdminResource } from '@/components/admin/use-resource'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api-client'
import { formatDateTime } from '@/lib/format'
import { CONTACT_INQUIRY_STATUSES, type ContactInquiry, type ContactInquiryStatus } from '@/lib/types'

export function ContactInquiryDetailView() {
  const { id } = useParams<{ id: string }>()
  const { data, error, loading, reload } = useAdminResource(() => api.adminContactInquiry(id), [id])
  const inquiry = (data as { data: ContactInquiry } | null)?.data
  const [notes, setNotes] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function save(patch: Record<string, unknown>) {
    setBusy(true)
    setMessage('')
    try {
      await api.updateContactInquiry(id, patch)
      await reload()
      setMessage('Saved.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to update inquiry.')
    } finally {
      setBusy(false)
    }
  }

  if (loading && !inquiry) return <p className="text-sm text-[#8b9994]">Loading inquiry…</p>
  if (error) return <p className="text-sm text-[#d1734b]">{error}</p>
  if (!inquiry) return null

  const noteValue = notes ?? inquiry.notes

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content / Contact"
        title={inquiry.name}
        description={inquiry.email}
        actions={(
          <div className="flex flex-wrap gap-2">
            {CONTACT_INQUIRY_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                disabled={busy || inquiry.status === status}
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
        <Meta label="Status" value={<StatusBadge value={inquiry.status} />} />
        <Meta label="Topic" value={inquiry.contact_topics?.label ?? '—'} />
        <Meta label="Received" value={formatDateTime(inquiry.created_at)} />
        <Meta label="Phone" value={inquiry.phone || '—'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
          <h2 className="font-display text-base font-bold text-[#243e39]">Details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Email"><a href={`mailto:${inquiry.email}`} className="font-semibold text-[#315e55]">{inquiry.email}</a></Row>
            <Row label="Subject">{inquiry.subject || '—'}</Row>
          </dl>
        </section>
        <section className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
          <h2 className="font-display text-base font-bold text-[#243e39]">Internal notes</h2>
          <Textarea className="mt-4" value={noteValue} onChange={(event) => setNotes(event.target.value)} />
          <button
            type="button"
            disabled={busy}
            onClick={() => void save({ notes: noteValue, status: inquiry.status as ContactInquiryStatus })}
            className="mt-3 inline-flex h-10 items-center rounded-xl bg-[#315e55] px-4 text-xs font-bold text-white hover:bg-[#294f48] disabled:opacity-60"
          >
            Save notes
          </button>
        </section>
      </div>

      <section className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
        <h2 className="font-display text-base font-bold text-[#243e39]">Message</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#5f746c]">{inquiry.message}</p>
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
