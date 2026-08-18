import { randomBytes } from 'crypto'
import { jsonError } from '@/lib/api/http'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  NEWSLETTER_SOURCES,
  NEWSLETTER_STATUSES,
  type NewsletterSource,
  type NewsletterStatus,
  type NewsletterSubscriber,
} from '@/lib/types'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SCHEMA_HINT = 'Newsletter tables are not initialized. Run scripts/015_newsletter.sql in the Supabase SQL editor.'

export function newsletterSchemaError(error: { message?: string } | null) {
  const message = error?.message ?? ''
  return /schema cache|does not exist|could not find the table/i.test(message)
}

export function newsletterSchemaResponse(error: { message?: string } | null) {
  if (!newsletterSchemaError(error)) return null
  return jsonError(SCHEMA_HINT, 503)
}

export function loadNewsletterDb() {
  try {
    return { db: createAdminClient(), error: null as ReturnType<typeof jsonError> | null }
  } catch {
    return { db: null, error: jsonError('Newsletter is not configured on this server.', 503) }
  }
}

export function isNewsletterStatus(value: unknown): value is NewsletterStatus {
  return typeof value === 'string' && (NEWSLETTER_STATUSES as readonly string[]).includes(value)
}

export function isNewsletterSource(value: unknown): value is NewsletterSource {
  return typeof value === 'string' && (NEWSLETTER_SOURCES as readonly string[]).includes(value)
}

export function normalizeNewsletterEmail(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase().slice(0, 160)
}

export function isValidNewsletterEmail(value: string) {
  return EMAIL.test(value) && value.length <= 160
}

export function newNewsletterToken() {
  return randomBytes(32).toString('hex')
}

export function newsletterAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export function unsubscribeUrl(token: string) {
  return `${newsletterAppUrl()}/unsubscribe?token=${encodeURIComponent(token)}`
}

export function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!local || !domain) return 'your inbox'
  const visible = local.slice(0, 1)
  return `${visible}***@${domain}`
}

export function publicNewsletter(row: NewsletterSubscriber) {
  return {
    status: row.status,
    email: maskEmail(row.email),
    subscribed: row.status === 'subscribed',
  }
}

export function subscribeFields(input: {
  email: string
  source: NewsletterSource
  userId?: string | null
  status?: NewsletterStatus
}) {
  const now = new Date().toISOString()
  const status = input.status ?? 'subscribed'
  return {
    email: input.email,
    status,
    source: input.source,
    user_id: input.userId || null,
    confirm_token: newNewsletterToken(),
    unsubscribe_token: newNewsletterToken(),
    confirmed_at: status === 'subscribed' ? now : null,
    unsubscribed_at: status === 'unsubscribed' ? now : null,
    notes: '',
  }
}
