'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { ArticleBodyEditor } from '@/components/admin/article-body-editor'
import { AdminButton } from '@/components/admin/filter-bar'
import { PageHeader } from '@/components/admin/page-header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { employmentLabel, slugifyJob, workplaceLabel } from '@/lib/careers'
import { marketPaths } from '@/lib/market-paths'
import {
  JOB_DEPARTMENTS,
  JOB_EMPLOYMENT_TYPES,
  JOB_WORKPLACES,
  type JobEmploymentType,
  type JobRole,
  type JobStatus,
  type JobWorkplace,
} from '@/lib/types'

const EMPTY: Partial<JobRole> = {
  title: '',
  slug: '',
  department: 'Engineering',
  location: 'Kampala, Uganda',
  employment_type: 'full_time',
  workplace: 'hybrid',
  excerpt: '',
  description: '',
  requirements: '',
  benefits: '',
  apply_email: '',
  apply_url: '',
  featured: false,
  sort_order: 0,
  status: 'draft',
  closes_at: null,
}

function dateInput(value?: string | null) {
  if (!value) return ''
  return value.slice(0, 10)
}

export function CareerEditorView({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [role, setRole] = useState<Partial<JobRole>>(EMPTY)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (mode !== 'edit') return
    void api.adminCareer(id).then((result) => {
      setRole(result.data)
      setSlugTouched(true)
    }).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load role.'))
  }, [id, mode])

  function set<K extends keyof JobRole>(key: K, value: JobRole[K]) {
    setRole((current) => ({ ...current, [key]: value }))
  }

  async function save(targetStatus: JobStatus) {
    setBusy(true)
    setError('')
    try {
      const payload = {
        title: role.title,
        slug: role.slug || slugifyJob(role.title ?? ''),
        department: role.department,
        location: role.location,
        employment_type: role.employment_type,
        workplace: role.workplace,
        excerpt: role.excerpt,
        description: role.description,
        requirements: role.requirements,
        benefits: role.benefits,
        apply_email: role.apply_email ?? '',
        apply_url: role.apply_url ?? '',
        featured: Boolean(role.featured),
        sort_order: role.sort_order ?? 0,
        closes_at: role.closes_at ? dateInput(role.closes_at) : null,
        status: targetStatus,
      }
      const saved = mode === 'new'
        ? (await api.createCareer(payload)).data
        : (await api.updateCareer(id, payload)).data
      setRole(saved)
      if (mode === 'new') {
        router.replace(adminPaths.career(saved.id))
        return
      }
      if (targetStatus === 'published' || targetStatus === 'closed' || targetStatus === 'archived') {
        router.push(adminPaths.careers)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save role.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content / Careers"
        title={mode === 'new' ? 'New role' : role.title || 'Edit role'}
        description="Draft the posting, then publish it to /careers. Closed roles stay in the archive for hiring history."
        actions={(
          <div className="flex flex-wrap gap-2">
            {mode === 'edit' && role.status === 'published' ? (
              <AdminButton href={marketPaths.career(role.slug ?? '')} variant="secondary">View live</AdminButton>
            ) : null}
            <AdminButton onClick={() => void save('draft')} variant="secondary" disabled={busy}>
              {busy ? 'Working…' : 'Save draft'}
            </AdminButton>
            <AdminButton onClick={() => void save('published')} variant="primary" disabled={busy}>
              {busy ? 'Working…' : 'Publish'}
            </AdminButton>
            {mode === 'edit' ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void save('closed')}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#f0c7b3] px-4 text-xs font-bold text-[#c86c48] transition hover:bg-[#fff5f0] disabled:opacity-60"
                >
                  Close role
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void save('archived')}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#dfe7e3] px-4 text-xs font-bold text-[#638076] transition hover:bg-[#f7fbf9] disabled:opacity-60"
                >
                  Archive
                </button>
              </>
            ) : null}
          </div>
        )}
      />

      {error ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">{error}</div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4 rounded-2xl border border-[#e2e9e5] bg-white p-5">
          <Field label="Title">
            <Input
              value={role.title ?? ''}
              onChange={(event) => {
                const title = event.target.value
                setRole((current) => ({
                  ...current,
                  title,
                  slug: slugTouched ? current.slug : slugifyJob(title),
                }))
              }}
            />
          </Field>
          <Field label="Slug">
            <Input
              value={role.slug ?? ''}
              placeholder="auto-generated from title"
              onChange={(event) => {
                setSlugTouched(true)
                set('slug', event.target.value)
              }}
            />
          </Field>
          <Field label="Short summary">
            <Textarea value={role.excerpt ?? ''} onChange={(event) => set('excerpt', event.target.value)} />
          </Field>
          <Field label="About the role">
            <ArticleBodyEditor value={role.description ?? ''} onChange={(html) => set('description', html)} />
          </Field>
          <Field label="What you will bring">
            <ArticleBodyEditor value={role.requirements ?? ''} onChange={(html) => set('requirements', html)} />
          </Field>
          <Field label="How we work / benefits">
            <ArticleBodyEditor value={role.benefits ?? ''} onChange={(html) => set('benefits', html)} />
          </Field>
        </div>

        <div className="space-y-4 rounded-2xl border border-[#e2e9e5] bg-white p-5">
          <Field label="Department">
            <Input
              list="career-departments"
              value={role.department ?? ''}
              onChange={(event) => set('department', event.target.value)}
            />
            <datalist id="career-departments">
              {JOB_DEPARTMENTS.map((item) => <option key={item} value={item} />)}
            </datalist>
          </Field>
          <Field label="Location">
            <Input value={role.location ?? ''} onChange={(event) => set('location', event.target.value)} />
          </Field>
          <Field label="Employment type">
            <select
              value={role.employment_type ?? 'full_time'}
              onChange={(event) => set('employment_type', event.target.value as JobEmploymentType)}
              className="h-10 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] px-3.5 text-sm font-medium text-[#243e39] outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
            >
              {JOB_EMPLOYMENT_TYPES.map((value) => (
                <option key={value} value={value}>{employmentLabel(value)}</option>
              ))}
            </select>
          </Field>
          <Field label="Workplace">
            <select
              value={role.workplace ?? 'hybrid'}
              onChange={(event) => set('workplace', event.target.value as JobWorkplace)}
              className="h-10 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] px-3.5 text-sm font-medium text-[#243e39] outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
            >
              {JOB_WORKPLACES.map((value) => (
                <option key={value} value={value}>{workplaceLabel(value)}</option>
              ))}
            </select>
          </Field>
          <Field label="Application deadline">
            <Input
              type="date"
              value={dateInput(role.closes_at)}
              onChange={(event) => set('closes_at', event.target.value || null)}
            />
          </Field>
          <Field label="Apply email (optional override)">
            <Input value={role.apply_email ?? ''} onChange={(event) => set('apply_email', event.target.value || null)} placeholder="careers@unimart.app" />
          </Field>
          <Field label="External apply URL">
            <Input value={role.apply_url ?? ''} onChange={(event) => set('apply_url', event.target.value || null)} placeholder="https://" />
          </Field>
          <Field label="Sort order">
            <Input
              type="number"
              min={0}
              value={role.sort_order ?? 0}
              onChange={(event) => set('sort_order', Number(event.target.value) || 0)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#526861]">
            <input
              type="checkbox"
              checked={Boolean(role.featured)}
              onChange={(event) => set('featured', event.target.checked)}
              className="size-4 accent-[#315e55]"
            />
            Feature this role at the top of /careers
          </label>
          {role.status ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">
              Status · <span className="text-[#315e55]">{role.status}</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
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
