'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api-client'

export function CareerApplyForm({
  roleId,
  roleTitle,
}: {
  roleId?: string | null
  roleTitle?: string
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    portfolio_url: '',
    linkedin_url: '',
    resume_url: '',
    cover_letter: '',
    company_website: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.applyCareer({
        ...form,
        role_id: roleId ?? null,
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit application.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-[22px] border border-[#d5e4de] bg-[#f7fbf9] px-5 py-8 text-center">
        <p className="font-display text-lg font-bold text-[#29463f]">Application received</p>
        <p className="mt-2 text-sm leading-6 text-[#748780]">
          Thanks{form.name ? `, ${form.name.split(' ')[0]}` : ''}. We read every note and will follow up if there is a fit
          {roleTitle ? ` for ${roleTitle}` : ''}.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <input
        tabIndex={-1}
        autoComplete="off"
        value={form.company_website}
        onChange={(event) => setForm((current) => ({ ...current, company_website: event.target.value }))}
        className="hidden"
        aria-hidden="true"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        </Field>
        <Field label="Email">
          <Input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
        </Field>
        <Field label="Where you are based">
          <Input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Kampala, Uganda" />
        </Field>
        <Field label="Portfolio or site">
          <Input value={form.portfolio_url} onChange={(event) => setForm((current) => ({ ...current, portfolio_url: event.target.value }))} placeholder="https://" />
        </Field>
        <Field label="LinkedIn">
          <Input value={form.linkedin_url} onChange={(event) => setForm((current) => ({ ...current, linkedin_url: event.target.value }))} placeholder="https://" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Resume link">
            <Input value={form.resume_url} onChange={(event) => setForm((current) => ({ ...current, resume_url: event.target.value }))} placeholder="Google Drive, Dropbox, or personal site" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={roleTitle ? `Why this role` : 'What you want to work on'}>
            <Textarea
              required
              value={form.cover_letter}
              onChange={(event) => setForm((current) => ({ ...current, cover_letter: event.target.value }))}
              placeholder="A few sentences on the work you care about and how you would help UniMart."
            />
          </Field>
        </div>
      </div>
      {error ? <p className="text-sm text-[#9a4f32]">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#315e55] px-5 text-sm font-bold text-white transition hover:bg-[#274c44] disabled:opacity-60"
      >
        {busy ? 'Sending…' : 'Submit application'}
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
