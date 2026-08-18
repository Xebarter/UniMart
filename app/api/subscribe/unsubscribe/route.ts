import { dbError, jsonError, jsonOk, parseJson } from '@/lib/api/http'
import { loadNewsletterDb, maskEmail, newsletterSchemaResponse, publicNewsletter } from '@/lib/newsletter'
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
  const token = tokenFrom(body.token)
  if (!token) return jsonError('Missing unsubscribe token.')

  const result = await findByToken(token)
  if (result.error) return result.error
  if (!result.row || !result.db) return jsonError('This unsubscribe link is invalid or has expired.', 404)

  if (result.row.status === 'unsubscribed') {
    return jsonOk({ ok: true, status: 'unsubscribed', email: maskEmail(result.row.email) })
  }

  const { error } = await result.db
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', result.row.id)
  if (error) return dbError(error, 'Unable to unsubscribe right now.', 400)
  return jsonOk({ ok: true, status: 'unsubscribed', email: maskEmail(result.row.email) })
}
