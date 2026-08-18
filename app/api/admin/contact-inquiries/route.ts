import { ilikeOr, parseListQuery } from '@/lib/admin/query'
import { dbError, jsonError, jsonOk, requireAdmin } from '@/lib/api/http'
import { contactSchemaError, isContactInquiryStatus } from '@/lib/contact'

const SELECT = '*, contact_topics(id, label)'

function schemaOrDb(error: { message?: string; code?: string } | null, fallback: string, status = 500) {
  if (contactSchemaError(error)) {
    return jsonError('Contact tables are not initialized. Run scripts/013_contact.sql in the Supabase SQL editor.', 503)
  }
  return dbError(error, fallback, status)
}

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { page, pageSize, q, from, to, searchParams } = parseListQuery(new URL(request.url))
  const status = searchParams.get('status')
  const topicId = searchParams.get('topic_id')

  let query = auth.supabase.from('contact_inquiries').select(SELECT, { count: 'exact' })
  if (isContactInquiryStatus(status)) query = query.eq('status', status)
  if (topicId && topicId !== 'all') query = query.eq('topic_id', topicId)
  if (q) query = query.or(ilikeOr(['name', 'email', 'subject', 'message'], q))

  const [{ data, error, count }, incoming, reviewing, replied, closed] = await Promise.all([
    query.order('created_at', { ascending: false }).range(from, to),
    auth.supabase.from('contact_inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    auth.supabase.from('contact_inquiries').select('id', { count: 'exact', head: true }).eq('status', 'reviewing'),
    auth.supabase.from('contact_inquiries').select('id', { count: 'exact', head: true }).eq('status', 'replied'),
    auth.supabase.from('contact_inquiries').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
  ])
  if (error) return schemaOrDb(error, 'Unable to load inquiries.')
  return jsonOk({
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    counts: {
      new: incoming.count ?? 0,
      reviewing: reviewing.count ?? 0,
      replied: replied.count ?? 0,
      closed: closed.count ?? 0,
    },
  })
}
