'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import { AdminButton } from '@/components/admin/filter-bar'
import { PageHeader } from '@/components/admin/page-header'
import { useAdminResource } from '@/components/admin/use-resource'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api-client'
import { formatDateTime } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import { DEFAULT_PRESS_PAGE, validatePressPage } from '@/lib/press'
import type { PressFaq, PressHighlight, PressPage } from '@/lib/types'

export function PressEditorView() {
  const { data, error, loading, reload } = useAdminResource(() => api.adminPress(), [])
  const [form, setForm] = useState<PressPage>(DEFAULT_PRESS_PAGE)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (data?.data) setForm(data.data)
  }, [data])

  function set<K extends keyof PressPage>(key: K, value: PressPage[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setMessage('')
  }

  function updateHighlight(index: number, patch: Partial<PressHighlight>) {
    set('highlights', form.highlights.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function updateFaq(index: number, patch: Partial<PressFaq>) {
    set('faqs', form.faqs.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  async function save() {
    const invalid = validatePressPage(form)
    if (invalid) {
      setMessage(invalid)
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const result = await api.updateAdminPress({
        eyebrow: form.eyebrow,
        hero_title: form.hero_title,
        hero_subtitle: form.hero_subtitle,
        contact_email: form.contact_email,
        contact_copy: form.contact_copy,
        contact_sla: form.contact_sla,
        boilerplate_title: form.boilerplate_title,
        boilerplate: form.boilerplate,
        highlights: form.highlights,
        quote_text: form.quote_text,
        quote_attribution: form.quote_attribution,
        quote_role: form.quote_role,
        faqs: form.faqs,
        media_notes: form.media_notes,
      })
      setForm(result.data)
      setMessage('Press page saved.')
      await reload()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to save press page.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content / Press"
        title="Press page"
        description="Manage the public /press page: hero, company boilerplate, highlights, media contact, quote, and FAQs."
        actions={(
          <>
            <AdminButton href={marketPaths.press} variant="secondary">
              <ExternalLink size={14} />
              View page
            </AdminButton>
            <AdminButton onClick={() => void save()} variant="primary" disabled={busy || loading}>
              {busy ? 'Saving…' : 'Save page'}
            </AdminButton>
          </>
        )}
      />

      {error || message ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${message.startsWith('Press page saved') ? 'border-[#cfe4d8] bg-[#f3faf6] text-[#2f6b52]' : 'border-[#f0c7b3] bg-[#fff5f0] text-[#9a4f32]'}`}>
          {error || message}
        </div>
      ) : null}

      {form.updated_at ? (
        <p className="text-xs font-semibold text-[#8b9994]">Last updated {formatDateTime(form.updated_at)}</p>
      ) : (
        <p className="text-xs font-semibold text-[#8b9994]">Not saved to the database yet. Saving creates the live press page.</p>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-[24px]" />
          ))}
        </div>
      ) : (
        <>
          <EditorCard
            eyebrow="Hero"
            title="Opening"
            description="Eyebrow, headline, and intro shown at the top of /press. Put a second line in the title to style it in peach."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Eyebrow" htmlFor="press-eyebrow">
                <Input id="press-eyebrow" value={form.eyebrow} onChange={(event) => set('eyebrow', event.target.value)} />
              </Field>
              <Field label="Contact email" htmlFor="press-email">
                <Input id="press-email" value={form.contact_email} onChange={(event) => set('contact_email', event.target.value)} />
              </Field>
              <Field label="Title" htmlFor="press-title" className="lg:col-span-2">
                <Textarea id="press-title" value={form.hero_title} onChange={(event) => set('hero_title', event.target.value)} />
              </Field>
              <Field label="Subtitle" htmlFor="press-subtitle" className="lg:col-span-2">
                <Textarea id="press-subtitle" value={form.hero_subtitle} onChange={(event) => set('hero_subtitle', event.target.value)} />
              </Field>
            </div>
          </EditorCard>

          <EditorCard
            eyebrow="Contact"
            title="Media desk"
            description="How journalists should reach UniMart and what to expect."
          >
            <div className="grid gap-4">
              <Field label="Contact copy" htmlFor="press-contact-copy">
                <Textarea id="press-contact-copy" value={form.contact_copy} onChange={(event) => set('contact_copy', event.target.value)} />
              </Field>
              <Field label="Response time" htmlFor="press-sla">
                <Input id="press-sla" value={form.contact_sla} onChange={(event) => set('contact_sla', event.target.value)} />
              </Field>
            </div>
          </EditorCard>

          <EditorCard
            eyebrow="Company"
            title="Boilerplate"
            description="Standard about copy reporters can quote or paste."
          >
            <div className="grid gap-4">
              <Field label="Section title" htmlFor="press-boilerplate-title">
                <Input id="press-boilerplate-title" value={form.boilerplate_title} onChange={(event) => set('boilerplate_title', event.target.value)} />
              </Field>
              <Field label="Boilerplate" htmlFor="press-boilerplate">
                <Textarea id="press-boilerplate" rows={6} value={form.boilerplate} onChange={(event) => set('boilerplate', event.target.value)} />
              </Field>
            </div>
          </EditorCard>

          <EditorCard
            eyebrow="Highlights"
            title="Facts at a glance"
            description="Short stat cards. Leave empty to hide this section on the public page."
            action={(
              <AdminButton
                onClick={() => set('highlights', [...form.highlights, { title: '', body: '' }])}
                disabled={form.highlights.length >= 8}
              >
                <Plus size={14} />
                Add highlight
              </AdminButton>
            )}
          >
            <div className="space-y-3">
              {form.highlights.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-2xl border border-[#edf1ef] bg-[#fafcfb] p-3 sm:grid-cols-[1fr_1.4fr_auto]">
                  <Input
                    placeholder="Label"
                    value={item.title}
                    onChange={(event) => updateHighlight(index, { title: event.target.value })}
                  />
                  <Input
                    placeholder="Value"
                    value={item.body}
                    onChange={(event) => updateHighlight(index, { body: event.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => set('highlights', form.highlights.filter((_, i) => i !== index))}
                    className="flex h-10 items-center justify-center rounded-xl text-[#c3d0cb] transition hover:bg-[#fff5f0] hover:text-[#c86c48]"
                    aria-label="Remove highlight"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {!form.highlights.length ? <p className="text-sm text-[#8b9994]">No highlights yet. Add a few facts for journalists.</p> : null}
            </div>
          </EditorCard>

          <EditorCard
            eyebrow="Quote"
            title="Leadership statement"
            description="Optional quote. Leave the quote blank to hide this block."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Quote" htmlFor="press-quote" className="lg:col-span-2">
                <Textarea id="press-quote" value={form.quote_text} onChange={(event) => set('quote_text', event.target.value)} />
              </Field>
              <Field label="Attribution" htmlFor="press-quote-name">
                <Input id="press-quote-name" value={form.quote_attribution} onChange={(event) => set('quote_attribution', event.target.value)} />
              </Field>
              <Field label="Role" htmlFor="press-quote-role">
                <Input id="press-quote-role" value={form.quote_role} onChange={(event) => set('quote_role', event.target.value)} />
              </Field>
            </div>
          </EditorCard>

          <EditorCard
            eyebrow="Guidance"
            title="Interview notes"
            description="What reporters should include when they write in."
          >
            <Field label="Media notes" htmlFor="press-notes">
              <Textarea id="press-notes" rows={5} value={form.media_notes} onChange={(event) => set('media_notes', event.target.value)} />
            </Field>
          </EditorCard>

          <EditorCard
            eyebrow="FAQ"
            title="Media questions"
            description="Common answers. Leave empty to hide this section."
            action={(
              <AdminButton
                onClick={() => set('faqs', [...form.faqs, { question: '', answer: '' }])}
                disabled={form.faqs.length >= 12}
              >
                <Plus size={14} />
                Add question
              </AdminButton>
            )}
          >
            <div className="space-y-3">
              {form.faqs.map((item, index) => (
                <div key={index} className="space-y-3 rounded-2xl border border-[#edf1ef] bg-[#fafcfb] p-3">
                  <div className="flex items-start gap-3">
                    <Input
                      placeholder="Question"
                      value={item.question}
                      onChange={(event) => updateFaq(index, { question: event.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => set('faqs', form.faqs.filter((_, i) => i !== index))}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#c3d0cb] transition hover:bg-[#fff5f0] hover:text-[#c86c48]"
                      aria-label="Remove question"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <Textarea
                    placeholder="Answer"
                    value={item.answer}
                    onChange={(event) => updateFaq(index, { answer: event.target.value })}
                  />
                </div>
              ))}
              {!form.faqs.length ? <p className="text-sm text-[#8b9994]">No FAQs yet. Add a few answers for interview requests.</p> : null}
            </div>
          </EditorCard>
        </>
      )}
    </div>
  )
}

function EditorCard({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">{eyebrow}</p>
          <h2 className="mt-1 font-display text-lg font-bold text-[#243e39]">{title}</h2>
          <p className="mt-1 text-sm text-[#748780]">{description}</p>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string
  htmlFor: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
