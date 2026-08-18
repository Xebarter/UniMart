import { writeAudit } from '@/lib/admin/audit'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'
import { isNewsletterStatus, newsletterSchemaError, newNewsletterToken, unsubscribeUrl } from '@/lib/newsletter'
import type { NewsletterSubscriber } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

function schemaOrDb(error: { message?: string; code?: string } | null, fallback: string, status = 500) {
  if (newsletterSchemaError(error)) {
    return jsonError('Newsletter tables are not initialized. Run scripts/015_newsletter.sql in the Supabase SQL editor.', 503)
  }
  return dbError(error, fallback, status)
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('newsletter_subscribers').select('*').eq('id', id).maybeSingle()
  if (error) return schemaOrDb(error, 'Unable to load subscriber.')
  if (!data) return jsonError('Subscriber not found.', 404)
  const row = data as NewsletterSubscriber
  return jsonOk({
    data: row,
    unsubscribe_url: row.unsubscribe_token ? unsubscribeUrl(row.unsubscribe_token) : '',
  })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')

  const updates: Record<string, unknown> = {}
  const now = new Date().toISOString()
  if (typeof body.status === 'string') {
    if (!isNewsletterStatus(body.status)) return jsonError('Invalid status.')
    updates.status = body.status
    if (body.status === 'unsubscribed') {
      updates.unsubscribed_at = now
    }
    if (body.status === 'subscribed') {
      updates.unsubscribed_at = null
      updates.confirmed_at = now
    }
  }
  if (typeof body.notes === 'string') updates.notes = body.notes.trim().slice(0, 8000)
  if (body.rotate_token === true) updates.unsubscribe_token = newNewsletterToken()
  if (!Object.keys(updates).length) return jsonError('No updates provided.')

  const { data, error } = await auth.supabase.from('newsletter_subscribers').update(updates).eq('id', id).select('*').single()
  if (error) return schemaOrDb(error, 'Unable to update subscriber.', 400)
  await writeAudit(auth.supabase, {
    actorId: auth.user.id,
    action: 'newsletter.subscriber',
    entityType: 'newsletter_subscriber',
    entityId: id,
    metadata: { ...updates, unsubscribe_token: undefined },
  })
  const row = data as NewsletterSubscriber
  return jsonOk({
    data: row,
    unsubscribe_url: row.unsubscribe_token ? unsubscribeUrl(row.unsubscribe_token) : '',
  })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { error } = await auth.supabase.from('newsletter_subscribers').delete().eq('id', id)
  if (error) return schemaOrDb(error, 'Unable to delete subscriber.', 400)
  await writeAudit(auth.supabase, {
    actorId: auth.user.id,
    action: 'newsletter.delete',
    entityType: 'newsletter_subscriber',
    entityId: id,
  })
  return jsonOk({ ok: true })
}
