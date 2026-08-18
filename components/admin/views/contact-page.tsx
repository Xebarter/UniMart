'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Inbox, Mail, Plus, Trash2 } from 'lucide-react'
import { AdminButton } from '@/components/admin/filter-bar'
import { InsightTile } from '@/components/admin/insight-tile'
import { PageHeader } from '@/components/admin/page-header'
import { useAdminResource } from '@/components/admin/use-resource'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { CONTACT_CHANNEL_ICONS, type ContactChannel, type ContactPageSettings, type ContactTopic } from '@/lib/types'
import { DEFAULT_CONTACT_PAGE } from '@/lib/contact'
import { marketPaths } from '@/lib/market-paths'

type PagePayload = {
  data: ContactPageSettings
  channels: ContactChannel[]
  topics: ContactTopic[]
}

type InquiryCounts = { new: number; reviewing: number; replied: number; closed: number }

export function ContactAdminView() {
  const router = useRouter()
  const page = useAdminResource(() => api.adminContactPage(), [])
  const inquiries = useAdminResource(() => api.adminContactInquiries('pageSize=1'), [])
  const payload = page.data as PagePayload | null
  const counts = (inquiries.data as { counts?: InquiryCounts } | null)?.counts
  const newCount = counts?.new ?? 0
  const total = (inquiries.data?.total as number | undefined) ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content / Contact"
        title="Contact"
        description="Manage the public /contact page, channels, form topics, and incoming inquiries."
        actions={(
          <>
            <AdminButton href={adminPaths.contactInquiries} variant="secondary">
              <Inbox size={14} />
              Inquiries
              {newCount ? (
                <span className="rounded-full bg-[#fff5f0] px-1.5 py-0.5 text-[10px] font-bold text-[#c86c48]">{newCount}</span>
              ) : null}
            </AdminButton>
            <AdminButton href={marketPaths.contact} variant="secondary">
              <ExternalLink size={14} />
              View page
            </AdminButton>
          </>
        )}
      />

      {page.error ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">{page.error}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightTile
          label="New inquiries"
          value={inquiries.loading ? '—' : newCount.toLocaleString()}
          hint="Waiting for a reply"
          icon={Inbox}
          accent="coral"
          onClick={() => router.push(`${adminPaths.contactInquiries}?status=new`)}
        />
        <InsightTile
          label="All inquiries"
          value={inquiries.loading ? '—' : total.toLocaleString()}
          hint="From the public form"
          icon={Mail}
          accent="slate"
          onClick={() => router.push(adminPaths.contactInquiries)}
        />
        <InsightTile
          label="Channels"
          value={page.loading ? '—' : String(payload?.channels.length ?? 0)}
          hint="Public contact cards"
          icon={Mail}
          accent="green"
          onClick={() => undefined}
        />
        <InsightTile
          label="Topics"
          value={page.loading ? '—' : String(payload?.topics.length ?? 0)}
          hint="Form categories"
          icon={Inbox}
          accent="amber"
          onClick={() => undefined}
        />
      </div>

      <PageCopyCard
        data={payload?.data ?? null}
        loading={page.loading}
        onSaved={() => void page.reload()}
      />
      <ChannelsCard
        channels={payload?.channels ?? []}
        loading={page.loading}
        onChanged={() => void page.reload()}
      />
      <TopicsCard
        topics={payload?.topics ?? []}
        loading={page.loading}
        onChanged={() => void page.reload()}
      />
    </div>
  )
}

function PageCopyCard({
  data,
  loading,
  onSaved,
}: {
  data: ContactPageSettings | null
  loading: boolean
  onSaved: () => void
}) {
  const [form, setForm] = useState<ContactPageSettings>(DEFAULT_CONTACT_PAGE)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  async function save() {
    setBusy(true)
    setMessage('')
    try {
      const result = await api.updateContactPage(form)
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
          <h2 className="mt-1 font-display text-lg font-bold text-[#243e39]">Hero and office copy</h2>
        </div>
        <AdminButton onClick={() => void save()} variant="primary" disabled={busy || loading}>
          {busy ? 'Saving…' : 'Save copy'}
        </AdminButton>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Field label="Headline">
          <Input value={form.headline} disabled={loading} onChange={(event) => setForm((current) => ({ ...current, headline: event.target.value }))} />
        </Field>
        <Field label="Response note">
          <Input value={form.response_note} disabled={loading} onChange={(event) => setForm((current) => ({ ...current, response_note: event.target.value }))} />
        </Field>
        <div className="space-y-2 lg:col-span-2">
          <Label>Intro</Label>
          <Textarea value={form.intro} disabled={loading} onChange={(event) => setForm((current) => ({ ...current, intro: event.target.value }))} />
        </div>
        <Field label="Office label">
          <Input value={form.office_label} disabled={loading} onChange={(event) => setForm((current) => ({ ...current, office_label: event.target.value }))} />
        </Field>
        <Field label="Hours">
          <Input value={form.hours} disabled={loading} onChange={(event) => setForm((current) => ({ ...current, hours: event.target.value }))} />
        </Field>
        <div className="space-y-2 lg:col-span-2">
          <Label>Office details</Label>
          <Input value={form.office_address} disabled={loading} onChange={(event) => setForm((current) => ({ ...current, office_address: event.target.value }))} />
        </div>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#526861]">
        <input
          type="checkbox"
          checked={form.accept_inquiries}
          disabled={loading}
          onChange={(event) => setForm((current) => ({ ...current, accept_inquiries: event.target.checked }))}
          className="size-4 accent-[#315e55]"
        />
        Accept public contact form submissions
      </label>
      {message ? <p className="mt-3 text-xs font-semibold text-[#638076]">{message}</p> : null}
    </div>
  )
}

function ChannelsCard({
  channels,
  loading,
  onChanged,
}: {
  channels: ContactChannel[]
  loading: boolean
  onChanged: () => void
}) {
  const [draft, setDraft] = useState({ title: '', description: '', value: '', href: '', icon: 'mail', sort_order: 0, published: true })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function create() {
    setBusy(true)
    setMessage('')
    try {
      await api.createContactChannel(draft)
      setDraft({ title: '', description: '', value: '', href: '', icon: 'mail', sort_order: channels.length * 10 + 10, published: true })
      onChanged()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to add channel.')
    } finally {
      setBusy(false)
    }
  }

  async function save(channel: ContactChannel) {
    setBusy(true)
    setMessage('')
    try {
      await api.updateContactChannel(channel.id, channel)
      onChanged()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to save channel.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    setBusy(true)
    setMessage('')
    try {
      await api.deleteContactChannel(id)
      onChanged()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to delete channel.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <EditableList
      eyebrow="Channels"
      title="Contact cards"
      description="These cards appear on /contact. Keep titles short."
      message={message}
    >
      {channels.map((channel) => (
        <ChannelRow
          key={channel.id}
          channel={channel}
          disabled={busy || loading}
          onChange={(next) => void save(next)}
          onDelete={() => void remove(channel.id)}
        />
      ))}
      <div className="grid gap-3 rounded-2xl border border-dashed border-[#dfe7e3] p-4 lg:grid-cols-[1fr_1fr_auto]">
        <Input placeholder="Title" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
        <Input placeholder="Value, e.g. hello@unimart.app" value={draft.value} onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))} />
        <AdminButton onClick={() => void create()} variant="primary" disabled={busy || !draft.title.trim()}>
          <Plus size={14} /> Add
        </AdminButton>
      </div>
    </EditableList>
  )
}

function ChannelRow({
  channel,
  disabled,
  onChange,
  onDelete,
}: {
  channel: ContactChannel
  disabled: boolean
  onChange: (channel: ContactChannel) => void
  onDelete: () => void
}) {
  const [local, setLocal] = useState(channel)
  useEffect(() => setLocal(channel), [channel])

  return (
    <div className="grid gap-3 rounded-2xl border border-[#eef3f0] p-4 lg:grid-cols-2">
      <Input value={local.title} disabled={disabled} onChange={(event) => setLocal((current) => ({ ...current, title: event.target.value }))} />
      <Input value={local.value} disabled={disabled} onChange={(event) => setLocal((current) => ({ ...current, value: event.target.value }))} />
      <Input value={local.description} disabled={disabled} onChange={(event) => setLocal((current) => ({ ...current, description: event.target.value }))} />
      <Input value={local.href} disabled={disabled} onChange={(event) => setLocal((current) => ({ ...current, href: event.target.value }))} />
      <select
        value={local.icon}
        disabled={disabled}
        onChange={(event) => setLocal((current) => ({ ...current, icon: event.target.value }))}
        className="h-10 rounded-xl border border-[#e5eae7] bg-[#fbfcfb] px-3 text-sm font-medium text-[#243e39]"
      >
        {CONTACT_CHANNEL_ICONS.map((icon) => (
          <option key={icon} value={icon}>{icon}</option>
        ))}
      </select>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-[#526861]">
          <input
            type="checkbox"
            checked={local.published}
            disabled={disabled}
            onChange={(event) => setLocal((current) => ({ ...current, published: event.target.checked }))}
            className="size-4 accent-[#315e55]"
          />
          Published
        </label>
        <AdminButton onClick={() => onChange(local)} disabled={disabled}>Save</AdminButton>
        <button type="button" disabled={disabled} onClick={onDelete} className="flex size-9 items-center justify-center rounded-xl text-[#c86c48] hover:bg-[#fff5f0]">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function TopicsCard({
  topics,
  loading,
  onChanged,
}: {
  topics: ContactTopic[]
  loading: boolean
  onChanged: () => void
}) {
  const [draft, setDraft] = useState({ label: '', description: '', sort_order: 0, published: true })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function create() {
    setBusy(true)
    setMessage('')
    try {
      await api.createContactTopic(draft)
      setDraft({ label: '', description: '', sort_order: topics.length * 10 + 10, published: true })
      onChanged()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to add topic.')
    } finally {
      setBusy(false)
    }
  }

  async function save(topic: ContactTopic) {
    setBusy(true)
    setMessage('')
    try {
      await api.updateContactTopic(topic.id, topic)
      onChanged()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to save topic.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    setBusy(true)
    setMessage('')
    try {
      await api.deleteContactTopic(id)
      onChanged()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to delete topic.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <EditableList
      eyebrow="Form topics"
      title="Inquiry topics"
      description="These options appear in the public contact form."
      message={message}
    >
      {topics.map((topic) => (
        <TopicRow
          key={topic.id}
          topic={topic}
          disabled={busy || loading}
          onChange={(next) => void save(next)}
          onDelete={() => void remove(topic.id)}
        />
      ))}
      <div className="grid gap-3 rounded-2xl border border-dashed border-[#dfe7e3] p-4 lg:grid-cols-[1fr_1fr_auto]">
        <Input placeholder="Topic label" value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} />
        <Input placeholder="Short description" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
        <AdminButton onClick={() => void create()} variant="primary" disabled={busy || !draft.label.trim()}>
          <Plus size={14} /> Add
        </AdminButton>
      </div>
    </EditableList>
  )
}

function TopicRow({
  topic,
  disabled,
  onChange,
  onDelete,
}: {
  topic: ContactTopic
  disabled: boolean
  onChange: (topic: ContactTopic) => void
  onDelete: () => void
}) {
  const [local, setLocal] = useState(topic)
  useEffect(() => setLocal(topic), [topic])

  return (
    <div className="grid gap-3 rounded-2xl border border-[#eef3f0] p-4 lg:grid-cols-[1fr_1fr_auto]">
      <Input value={local.label} disabled={disabled} onChange={(event) => setLocal((current) => ({ ...current, label: event.target.value }))} />
      <Input value={local.description} disabled={disabled} onChange={(event) => setLocal((current) => ({ ...current, description: event.target.value }))} />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-[#526861]">
          <input
            type="checkbox"
            checked={local.published}
            disabled={disabled}
            onChange={(event) => setLocal((current) => ({ ...current, published: event.target.checked }))}
            className="size-4 accent-[#315e55]"
          />
          Live
        </label>
        <AdminButton onClick={() => onChange(local)} disabled={disabled}>Save</AdminButton>
        <button type="button" disabled={disabled} onClick={onDelete} className="flex size-9 items-center justify-center rounded-xl text-[#c86c48] hover:bg-[#fff5f0]">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function EditableList({
  eyebrow,
  title,
  description,
  message,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  message: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">{eyebrow}</p>
      <h2 className="mt-1 font-display text-lg font-bold text-[#243e39]">{title}</h2>
      <p className="mt-1 text-sm text-[#748780]">{description}</p>
      <div className="mt-5 space-y-3">{children}</div>
      {message ? <p className="mt-3 text-xs font-semibold text-[#638076]">{message}</p> : null}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
