import { sanitizeArticleHtml } from '@/lib/article'
import {
  JOB_APPLICATION_STATUSES,
  JOB_EMPLOYMENT_TYPES,
  JOB_STATUSES,
  JOB_WORKPLACES,
  type CareerPageSettings,
  type JobApplicationStatus,
  type JobEmploymentType,
  type JobRole,
  type JobStatus,
  type JobWorkplace,
} from '@/lib/types'

export const DEFAULT_CAREER_PAGE: CareerPageSettings = {
  id: 1,
  headline: 'Work on the marketplace nearby.',
  intro: 'UniMart is a small team building a local marketplace. We hire people who care about buyers and sellers, ship with care, and think long-term.',
  apply_email: 'careers@unimart.app',
  accept_general: true,
}

export function slugifyJob(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

export function employmentLabel(value?: string | null) {
  switch (value) {
    case 'full_time':
      return 'Full-time'
    case 'part_time':
      return 'Part-time'
    case 'contract':
      return 'Contract'
    case 'internship':
      return 'Internship'
    default:
      return value || '—'
  }
}

export function workplaceLabel(value?: string | null) {
  switch (value) {
    case 'onsite':
      return 'On-site'
    case 'remote':
      return 'Remote'
    case 'hybrid':
      return 'Hybrid'
    default:
      return value || '—'
  }
}

export function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === 'string' && (JOB_STATUSES as readonly string[]).includes(value)
}

export function isEmploymentType(value: unknown): value is JobEmploymentType {
  return typeof value === 'string' && (JOB_EMPLOYMENT_TYPES as readonly string[]).includes(value)
}

export function isWorkplace(value: unknown): value is JobWorkplace {
  return typeof value === 'string' && (JOB_WORKPLACES as readonly string[]).includes(value)
}

export function isApplicationStatus(value: unknown): value is JobApplicationStatus {
  return typeof value === 'string' && (JOB_APPLICATION_STATUSES as readonly string[]).includes(value)
}

export function isJobRoleOpen(role: Pick<JobRole, 'status' | 'closes_at'>) {
  if (role.status !== 'published') return false
  if (role.closes_at && Date.parse(role.closes_at) < Date.now()) return false
  return true
}

export function parseOptionalUrl(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^https?:\/\//i.test(trimmed)) return null
  return trimmed.slice(0, 500)
}

export function parseClosesAt(value: unknown) {
  if (value === null) return null
  if (typeof value !== 'string' || !value.trim()) return null
  const raw = value.trim()
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T23:59:59.000Z` : raw
  const time = Date.parse(iso)
  if (!Number.isFinite(time)) return null
  return new Date(time).toISOString()
}

export function jobRoleFromBody(body: Record<string, unknown>, titleFallback = '') {
  const title = typeof body.title === 'string' ? body.title.trim() : titleFallback
  const slugSource = typeof body.slug === 'string' && body.slug.trim() ? body.slug : title
  return {
    title,
    slug: slugifyJob(slugSource),
    department: typeof body.department === 'string' && body.department.trim() ? body.department.trim().slice(0, 80) : 'General',
    location: typeof body.location === 'string' && body.location.trim() ? body.location.trim().slice(0, 120) : 'Kampala, Uganda',
    employment_type: isEmploymentType(body.employment_type) ? body.employment_type : 'full_time' as const,
    workplace: isWorkplace(body.workplace) ? body.workplace : 'hybrid' as const,
    excerpt: typeof body.excerpt === 'string' ? body.excerpt.trim().slice(0, 400) : '',
    description: sanitizeArticleHtml(typeof body.description === 'string' ? body.description : ''),
    requirements: sanitizeArticleHtml(typeof body.requirements === 'string' ? body.requirements : ''),
    benefits: sanitizeArticleHtml(typeof body.benefits === 'string' ? body.benefits : ''),
    apply_email: typeof body.apply_email === 'string' ? body.apply_email.trim().slice(0, 160) || null : null,
    apply_url: parseOptionalUrl(body.apply_url),
    featured: Boolean(body.featured),
    sort_order: Number.isFinite(Number(body.sort_order)) ? Math.max(0, Math.round(Number(body.sort_order))) : 0,
    closes_at: parseClosesAt(body.closes_at),
  }
}

export function careersSchemaError(error: { message?: string } | null) {
  const message = error?.message ?? ''
  return /schema cache|does not exist|could not find the table/i.test(message)
}
