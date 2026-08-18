import { dbError, jsonError, jsonOk, parseJson } from '@/lib/api/http'
import { contactText } from '@/lib/contact'
import {
  appendUnsubscribeNote,
  isUnsubscribeReason,
  isValidNewsletterEmail,
  loadNewsletterDb,
  maskEmail,
  newsletterSchemaResponse,
  normalizeNewsletterEmail,
  publicNewsletter,
} from '@/lib/newsletter'
import type { NewsletterSubscriber } from '@/lib/types'

export const runtime = 'nodejs'

function tokenFrom(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 128) : ''
}

async function findByToken(token: string) {
  const loaded = loadNewsletterDb()
  if (loaded.error || !loaded.db) return { row: null as NewsletterSubscriber | null, error: loaded.error, db: loaded.db }
  const { data, error } = await loaded.db
    .from('newsletter_subscribers')
    .select('*')
    .eq('unsubscribe_token', token)
    .maybeSingle()
  const schema = newsletterSchemaResponse(error)
  if (schema) return { row: null, error: schema, db: loaded.db }
  if (error) return { row: null, error: dbError(error, 'Unable to look up this subscription.'), db: loaded.db }
  if (!data) return { row: null, error: jsonError('This unsubscribe link is invalid or has expired.', 404), db: loaded.db }
  return { row: data as NewsletterSubscriber, error: null, db: loaded.db }
}

export async function GET(request: Request) {
  const token = tokenFrom(new URL(request.url).searchParams.get('token'))
  if (!token) return jsonError('Missing unsubscribe token.')
  const result = await findByToken(token)
  if (result.error) return result.error
  if (!result.row) return jsonError('This unsubscribe link is invalid or has expired.', 404)
  return jsonOk(publicNewsletter(result.row))
}

export async function POST(request: Request) {
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  if (contactText(body.company_website, 200)) return jsonOk({ ok: true, status: 'unsubscribed' })

  const token = tokenFrom(body.token)
  const email = normalizeNewsletterEmail(body.email)
  const reason = isUnsubscribeReason(body.reason) ? body.reason : null

  if (token) {
    const result = await findByToken(token)
    if (result.error) return result.error
    if (!result.row || !result.db) return jsonError('This unsubscribe link is invalid or has expired.', 404)
    if (result.row.status === 'unsubscribed') {
      return jsonOk({ ok: true, status: 'unsubscribed', email: maskEmail(result.row.email), already: true })
    }
    const { error } = await result.db
      .from('newsletter_subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        notes: appendUnsubscribeNote(result.row.notes, reason),
      })
      .eq('id', result.row.id)
    if (error) return dbError(error, 'Unable to unsubscribe right now.', 400)
    return jsonOk({ ok: true, status: 'unsubscribed', email: maskEmail(result.row.email) })
  }

  if (!isValidNewsletterEmail(email)) return jsonError('Enter the email address you used to subscribe.')

  const loaded = loadNewsletterDb()
  if (loaded.error || !loaded.db) return loaded.error ?? jsonError('Newsletter is not configured on this server.', 503)

  const { data, error } = await loaded.db
    .from('newsletter_subscribers')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  const schema = newsletterSchemaResponse(error)
  if (schema) return schema
  if (error) return dbError(error, 'Unable to unsubscribe right now.')

  const row = data as NewsletterSubscriber | null
  if (!row || row.status === 'unsubscribed') {
    return jsonOk({ ok: true, status: 'unsubscribed', email: maskEmail(email), already: true })
  }

  const { error: updateError } = await loaded.db
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
      notes: appendUnsubscribeNote(row.notes, reason),
    })
    .eq('id', row.id)
  if (updateError) return dbError(updateError, 'Unable to unsubscribe right now.', 400)
  return jsonOk({ ok: true, status: 'unsubscribed', email: maskEmail(email) })
}
