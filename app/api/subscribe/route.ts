import { dbError, jsonError, jsonOk, parseJson } from '@/lib/api/http'
import {
  isNewsletterSource,
  isValidNewsletterEmail,
  loadNewsletterDb,
  newsletterSchemaResponse,
  normalizeNewsletterEmail,
  subscribeFields,
} from '@/lib/newsletter'
import { createClient } from '@/lib/supabase/server'
import { contactText } from '@/lib/contact'
import type { NewsletterSubscriber } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  if (contactText(body.company_website, 200)) return jsonOk({ ok: true, status: 'subscribed' }, 201)

  const email = normalizeNewsletterEmail(body.email)
  if (!isValidNewsletterEmail(email)) return jsonError('Enter a valid email address.')

  const source = isNewsletterSource(body.source) ? body.source : 'footer'
  const loaded = loadNewsletterDb()
  if (loaded.error || !loaded.db) return loaded.error ?? jsonError('Newsletter is not configured on this server.', 503)

  let userId: string | null = null
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch {
    userId = null
  }

  const { data: existing, error: lookupError } = await loaded.db
    .from('newsletter_subscribers')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  const schema = newsletterSchemaResponse(lookupError)
  if (schema) return schema
  if (lookupError) return dbError(lookupError, 'Unable to subscribe right now.')

  const row = existing as NewsletterSubscriber | null
  if (row?.status === 'subscribed') {
    const patch: Record<string, unknown> = {}
    if (userId && !row.user_id) patch.user_id = userId
    if (Object.keys(patch).length) {
      await loaded.db.from('newsletter_subscribers').update(patch).eq('id', row.id)
    }
    return jsonOk({ ok: true, status: 'subscribed', already: true })
  }

  if (row) {
    const now = new Date().toISOString()
    const { error } = await loaded.db
      .from('newsletter_subscribers')
      .update({
        status: 'subscribed',
        source: row.source || source,
        user_id: userId || row.user_id,
        confirmed_at: row.confirmed_at ?? now,
        unsubscribed_at: null,
        unsubscribe_token: row.unsubscribe_token,
      })
      .eq('id', row.id)
    if (error) return dbError(error, 'Unable to subscribe right now.', 400)
    return jsonOk({ ok: true, status: 'subscribed', resumed: true }, 201)
  }

  const { error } = await loaded.db.from('newsletter_subscribers').insert(
    subscribeFields({ email, source, userId, status: 'subscribed' }),
  )
  if (error) {
    const schemaInsert = newsletterSchemaResponse(error)
    if (schemaInsert) return schemaInsert
    if (userId && /foreign key|user_id/i.test(error.message ?? '')) {
      const retry = await loaded.db.from('newsletter_subscribers').insert(
        subscribeFields({ email, source, userId: null, status: 'subscribed' }),
      )
      if (!retry.error) return jsonOk({ ok: true, status: 'subscribed' }, 201)
    }
    return dbError(error, 'Unable to subscribe right now.', 400)
  }
  return jsonOk({ ok: true, status: 'subscribed' }, 201)
}
