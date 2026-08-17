import { dbError, jsonError, jsonOk, requireAdmin } from '@/lib/api/http'
import { parseRangeDays } from '@/lib/admin/query'
import type { AdminStats, ListingCategory, Payment, Report } from '@/lib/types'

function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const days = parseRangeDays(new URL(request.url).searchParams.get('range'))
  const since = new Date()
  since.setDate(since.getDate() - days)
  const prev = new Date(since)
  prev.setDate(prev.getDate() - days)
  const sinceIso = since.toISOString()
  const prevIso = prev.toISOString()

  const [
    users,
    listings,
    reports,
    payments,
    shops,
    featured,
    recentListings,
    previousListings,
    recentUsers,
    previousUsers,
    previousReports,
    previousPayments,
    paidFeatures,
    queueReports,
    queueListings,
    queuePayments,
  ] = await Promise.all([
    auth.supabase.from('profiles').select('id', { count: 'exact', head: true }),
    auth.supabase.from('listings').select('id, category', { count: 'exact' }).eq('status', 'active'),
    auth.supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    auth.supabase.from('payments').select('amount, status').eq('status', 'paid'),
    auth.supabase.from('shops').select('id', { count: 'exact', head: true }),
    auth.supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active').gt('featured_until', new Date().toISOString()),
    auth.supabase.from('listings').select('id', { count: 'exact', head: true }).gte('created_at', sinceIso),
    auth.supabase.from('listings').select('id', { count: 'exact', head: true }).gte('created_at', prevIso).lt('created_at', sinceIso),
    auth.supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sinceIso),
    auth.supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', prevIso).lt('created_at', sinceIso),
    auth.supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open').gte('created_at', prevIso).lt('created_at', sinceIso),
    auth.supabase.from('payments').select('amount').eq('status', 'paid').gte('created_at', prevIso).lt('created_at', sinceIso),
    auth.supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'paid').eq('purpose', 'listing_feature'),
    auth.supabase.from('reports').select('*, listings(id, title)').in('status', ['open', 'reviewing']).order('created_at', { ascending: false }).limit(6),
    auth.supabase.from('listings').select('id, title, status, category, created_at').in('status', ['pending', 'removed']).order('created_at', { ascending: false }).limit(6),
    auth.supabase.from('payments').select('*, profiles:user_id(id, display_name, avatar_url), listings(id, title)').order('created_at', { ascending: false }).limit(6),
  ])

  if (users.error) return dbError(users.error, 'Unable to load admin stats.')

  const [{ data: listingActivity }, { data: userActivity }] = await Promise.all([
    auth.supabase.from('listings').select('created_at').gte('created_at', sinceIso).order('created_at', { ascending: true }),
    auth.supabase.from('profiles').select('created_at').gte('created_at', sinceIso).order('created_at', { ascending: true }),
  ])

  const dayKeys = Array.from({ length: days }, (_, index) => {
    const day = new Date()
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - (days - 1 - index))
    return day.toISOString().slice(0, 10)
  })
  const listingCounts = new Map(dayKeys.map((day) => [day, 0]))
  const userCounts = new Map(dayKeys.map((day) => [day, 0]))
  for (const row of listingActivity ?? []) listingCounts.set(row.created_at.slice(0, 10), (listingCounts.get(row.created_at.slice(0, 10)) ?? 0) + 1)
  for (const row of userActivity ?? []) userCounts.set(row.created_at.slice(0, 10), (userCounts.get(row.created_at.slice(0, 10)) ?? 0) + 1)

  const categories: ListingCategory[] = ['Products', 'Services', 'Rentals', 'Gigs']
  const categoryCounts = Object.fromEntries(categories.map((label) => [label, 0])) as Record<ListingCategory, number>
  for (const row of listings.data ?? []) categoryCounts[row.category as ListingCategory] += 1
  const totalListings = listings.count ?? listings.data?.length ?? 0
  const by_category = categories.map((label) => ({
    label,
    count: categoryCounts[label],
    percent: `${totalListings ? Math.round((categoryCounts[label] / totalListings) * 100) : 0}%`,
  }))

  const grossVolume = (payments.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const prevVolume = (previousPayments.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)

  const data: AdminStats = {
    total_users: users.count ?? 0,
    active_listings: listings.count ?? 0,
    pending_reports: reports.count ?? 0,
    gross_volume: grossVolume,
    total_shops: shops.count ?? 0,
    featured_listings: featured.count ?? 0,
    paid_features: paidFeatures.count ?? 0,
    users_change: percentChange(recentUsers.count ?? 0, previousUsers.count ?? 0),
    listings_change: percentChange(recentListings.count ?? 0, previousListings.count ?? 0),
    reports_change: percentChange(reports.count ?? 0, previousReports.count ?? 0),
    volume_change: percentChange(grossVolume, prevVolume),
    range_days: days,
    activity: dayKeys.map((date) => ({
      date: date.slice(5),
      listings: listingCounts.get(date) ?? 0,
      users: userCounts.get(date) ?? 0,
    })),
    by_category,
    queues: {
      reports: (queueReports.data ?? []) as Report[],
      listings: queueListings.data ?? [],
      payments: (queuePayments.data ?? []) as Payment[],
    },
  }

  if (!Number.isFinite(data.users_change)) data.users_change = 0
  return jsonOk({ data })
}

export async function POST() {
  return jsonError('Method not allowed.', 405)
}
