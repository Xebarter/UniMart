import { dbError, jsonError, jsonOk, parseJson, requireUser } from '@/lib/api/http'
import {
  isValidNewsletterEmail,
  loadNewsletterDb,
  newsletterSchemaResponse,
  normalizeNewsletterEmail,
  subscribeFields,
} from '@/lib/newsletter'
import type { NewsletterSubscriber } from '@/lib/types'

export const runtime = 'nodejs'

async function loadMine(userId: string, email: string | null) {
  const loaded = loadNewsletterDb()
  if (loaded.error || !loaded.db) return { row: null as NewsletterSubscriber | null, error: loaded.error, db: loaded.db }

  let query = loaded.db.from('newsletter_subscribers').select('*')
  if (email) query = query.or(`user_id.eq.${userId},email.eq.${email}`)
  else query = query.eq('user_id', userId)

  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle()
  const schema = newsletterSchemaResponse(error)
  if (schema) return { row: null, error: schema, db: loaded.db }
  if (error) return { row: null, error: dbError(error, 'Unable to load newsletter preference.'), db: loaded.db }
  return { row: (data as NewsletterSubscriber | null) ?? null, error: null, db: loaded.db }
}

export async function GET() {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const email = normalizeNewsletterEmail(auth.user.email ?? '')
  const result = await loadMine(auth.user.id, email || null)
  if (result.error) {
    if (result.error.status === 503) {
      return jsonOk({ subscribed: false, status: 'none', email: email || null, available: false })
    }
    return result.error
  }
  return jsonOk({
    subscribed: result.row?.status === 'subscribed',
    status: result.row?.status ?? 'none',
    email: email || result.row?.email || null,
    available: true,
  })
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson<{ subscribed?: boolean }>(request)
  if (!body || typeof body.subscribed !== 'boolean') return jsonError('Set subscribed to true or false.')

  const email = normalizeNewsletterEmail(auth.user.email ?? '')
  if (!isValidNewsletterEmail(email)) return jsonError('Your account needs a valid email address to manage this preference.')

  const result = await loadMine(auth.user.id, email)
  if (result.error) return result.error
  if (!result.db) return jsonError('Newsletter is not configured on this server.', 503)

  const now = new Date().toISOString()
  if (body.subscribed) {
    if (result.row) {
      const { error } = await result.db
        .from('newsletter_subscribers')
        .update({
          status: 'subscribed',
          email,
          user_id: auth.user.id,
          source: result.row.source || 'settings',
          confirmed_at: result.row.confirmed_at ?? now,
          unsubscribed_at: null,
        })
        .eq('id', result.row.id)
      if (error) return dbError(error, 'Unable to update newsletter preference.', 400)
    } else {
      const { error } = await result.db.from('newsletter_subscribers').insert(
        subscribeFields({ email, source: 'settings', userId: auth.user.id, status: 'subscribed' }),
      )
      if (error) return dbError(error, 'Unable to subscribe right now.', 400)
    }
    return jsonOk({ subscribed: true, status: 'subscribed' })
  }

  if (!result.row) return jsonOk({ subscribed: false, status: 'none' })
  const { error } = await result.db
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed',
      user_id: auth.user.id,
      unsubscribed_at: now,
    })
    .eq('id', result.row.id)
  if (error) return dbError(error, 'Unable to update newsletter preference.', 400)
  return jsonOk({ subscribed: false, status: 'unsubscribed' })
}
