import { ilikeOr, parseListQuery } from '@/lib/admin/query'
import { dbError, jsonError, jsonOk, requireAdmin } from '@/lib/api/http'
import { isNewsletterSource, isNewsletterStatus, newsletterSchemaError } from '@/lib/newsletter'

const SELECT = 'id, email, status, source, user_id, notes, confirmed_at, unsubscribed_at, created_at, updated_at'

function schemaOrDb(error: { message?: string; code?: string } | null, fallback: string, status = 500) {
  if (newsletterSchemaError(error)) {
    return jsonError('Newsletter tables are not initialized. Run scripts/015_newsletter.sql in the Supabase SQL editor.', 503)
  }
  return dbError(error, fallback, status)
}

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { page, pageSize, q, from, to, searchParams } = parseListQuery(new URL(request.url))
  const status = searchParams.get('status')
  const source = searchParams.get('source')

  let query = auth.supabase.from('newsletter_subscribers').select(SELECT, { count: 'exact' })
  if (isNewsletterStatus(status)) query = query.eq('status', status)
  if (isNewsletterSource(source)) query = query.eq('source', source)
  if (q) query = query.or(ilikeOr(['email', 'notes', 'source'], q))

  const [{ data, error, count }, subscribed, unsubscribed, pending] = await Promise.all([
    query.order('created_at', { ascending: false }).range(from, to),
    auth.supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', 'subscribed'),
    auth.supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', 'unsubscribed'),
    auth.supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  if (error) return schemaOrDb(error, 'Unable to load subscribers.')
  return jsonOk({
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    counts: {
      subscribed: subscribed.count ?? 0,
      unsubscribed: unsubscribed.count ?? 0,
      pending: pending.count ?? 0,
    },
  })
}
