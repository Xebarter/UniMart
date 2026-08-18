'use client'

import type { ReactNode } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { useAdminResource } from '@/components/admin/use-resource'
import { Textarea } from '@/components/ui/textarea'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { formatDateTime } from '@/lib/format'
import { NEWSLETTER_STATUSES, type NewsletterStatus, type NewsletterSubscriber } from '@/lib/types'

export function SubscriberDetailView() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data, error, loading, reload } = useAdminResource(() => api.adminSubscriber(id), [id])
  const subscriber = (data as { data: NewsletterSubscriber; unsubscribe_url?: string } | null)?.data
  const unsubscribeUrl = (data as { unsubscribe_url?: string } | null)?.unsubscribe_url ?? ''
  const [notes, setNotes] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  async function save(patch: Record<string, unknown>) {
    setBusy(true)
    setMessage('')
    try {
      await api.updateAdminSubscriber(id, patch)
      await reload()
      setMessage('Saved.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to update subscriber.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!window.confirm('Delete this subscriber permanently?')) return
    setBusy(true)
    setMessage('')
    try {
      await api.deleteAdminSubscriber(id)
      router.push(adminPaths.subscribers)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to delete subscriber.')
      setBusy(false)
    }
  }

  async function copyLink() {
    if (!unsubscribeUrl) return
    try {
      await navigator.clipboard.writeText(unsubscribeUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setMessage('Unable to copy the unsubscribe link.')
    }
  }

  if (loading && !subscriber) return <p className="text-sm text-[#8b9994]">Loading subscriber…</p>
  if (error) return <p className="text-sm text-[#d1734b]">{error}</p>
  if (!subscriber) return null

  const noteValue = notes ?? subscriber.notes

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content / Subscribers"
        title={subscriber.email}
        description={`Joined from ${subscriber.source}`}
        actions={(
          <div className="flex flex-wrap gap-2">
            {NEWSLETTER_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                disabled={busy || subscriber.status === status}
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
        <Meta label="Status" value={<StatusBadge value={subscriber.status as NewsletterStatus} />} />
        <Meta label="Source" value={<span className="capitalize">{subscriber.source}</span>} />
        <Meta label="Joined" value={formatDateTime(subscriber.created_at)} />
        <Meta label="Confirmed" value={subscriber.confirmed_at ? formatDateTime(subscriber.confirmed_at) : '—'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
          <h2 className="font-display text-base font-bold text-[#243e39]">Details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Email">
              <a href={`mailto:${subscriber.email}`} className="font-semibold text-[#315e55]">{subscriber.email}</a>
            </Row>
            <Row label="Unsubscribed">{subscriber.unsubscribed_at ? formatDateTime(subscriber.unsubscribed_at) : '—'}</Row>
            <Row label="Account">{subscriber.user_id ? 'Linked' : 'Guest'}</Row>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!unsubscribeUrl}
              onClick={() => void copyLink()}
              className="inline-flex h-10 items-center rounded-xl border border-[#dfe7e3] bg-white px-4 text-xs font-bold text-[#638076] hover:bg-[#f7fbf9] disabled:opacity-40"
            >
              {copied ? 'Copied' : 'Copy unsubscribe link'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void save({ rotate_token: true })}
              className="inline-flex h-10 items-center rounded-xl border border-[#dfe7e3] bg-white px-4 text-xs font-bold text-[#638076] hover:bg-[#f7fbf9] disabled:opacity-40"
            >
              Rotate link
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove()}
              className="inline-flex h-10 items-center rounded-xl border border-[#f0c7b3] bg-[#fff5f0] px-4 text-xs font-bold text-[#9a4f32] hover:bg-[#ffece4] disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        </section>
        <section className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
          <h2 className="font-display text-base font-bold text-[#243e39]">Internal notes</h2>
          <Textarea className="mt-4" value={noteValue} onChange={(event) => setNotes(event.target.value)} />
          <button
            type="button"
            disabled={busy}
            onClick={() => void save({ notes: noteValue })}
            className="mt-3 inline-flex h-10 items-center rounded-xl bg-[#315e55] px-4 text-xs font-bold text-white hover:bg-[#294f48] disabled:opacity-60"
          >
            Save notes
          </button>
        </section>
      </div>
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
