import { ilikeOr, parseListQuery, parseRangeDays } from '@/lib/admin/query'
import { jsonError, requireAdmin } from '@/lib/api/http'

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return 'id\n'
  const headers = Object.keys(rows[0])
  const escape = (value: unknown) => {
    const text = value == null ? '' : String(value)
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
    return text
  }
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n')
}

function csvResponse(filename: string, rows: Record<string, unknown>[]) {
  return new Response(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const url = new URL(request.url)
  const type = url.searchParams.get('type')
  const { q, searchParams } = parseListQuery(url)
  const limit = 2000

  if (type === 'users') {
    let query = auth.supabase.from('profiles').select('id, display_name, university, campus, role, verified, account_status, created_at')
    if (q) query = query.or(ilikeOr(['display_name', 'university', 'campus'], q))
    const { data } = await query.order('created_at', { ascending: false }).limit(limit)
    return csvResponse('unimart-users.csv', (data ?? []) as Record<string, unknown>[])
  }
  if (type === 'listings') {
    let query = auth.supabase.from('listings').select('id, title, category, price, currency, status, location, created_at')
    const status = searchParams.get('status')
    if (status && status !== 'all') query = query.eq('status', status)
    if (q) query = query.or(ilikeOr(['title', 'location'], q))
    const { data } = await query.order('created_at', { ascending: false }).limit(limit)
    return csvResponse('unimart-listings.csv', (data ?? []) as Record<string, unknown>[])
  }
  if (type === 'payments') {
    const { data } = await auth.supabase.from('payments').select('id, provider, purpose, amount, currency, status, created_at, paid_at').order('created_at', { ascending: false }).limit(limit)
    return csvResponse('unimart-payments.csv', (data ?? []) as Record<string, unknown>[])
  }
  if (type === 'reports') {
    const { data } = await auth.supabase.from('reports').select('id, reason, status, listing_id, reported_user_id, created_at').order('created_at', { ascending: false }).limit(limit)
    return csvResponse('unimart-reports.csv', (data ?? []) as Record<string, unknown>[])
  }
  if (type === 'analytics') {
    const days = parseRangeDays(searchParams.get('range'))
    const since = new Date()
    since.setDate(since.getDate() - days)
    const event = (searchParams.get('event') ?? '').trim()
    let query = auth.supabase.from('analytics_events').select('id, event_name, user_id, listing_id, created_at').gte('created_at', since.toISOString())
    if (q) query = query.ilike('event_name', `%${q}%`)
    if (event) query = query.eq('event_name', event)
    const { data } = await query.order('created_at', { ascending: false }).limit(limit)
    return csvResponse('unimart-analytics.csv', (data ?? []) as Record<string, unknown>[])
  }
  if (type === 'subscribers') {
    let query = auth.supabase.from('newsletter_subscribers').select('id, email, status, source, confirmed_at, unsubscribed_at, created_at')
    const status = searchParams.get('status')
    if (status && status !== 'all') query = query.eq('status', status)
    if (q) query = query.or(ilikeOr(['email', 'notes', 'source'], q))
    const { data } = await query.order('created_at', { ascending: false }).limit(limit)
    return csvResponse('unimart-subscribers.csv', (data ?? []) as Record<string, unknown>[])
  }
  return jsonError('Choose type=users, listings, payments, reports, analytics, or subscribers.')
}
