import { dbError, jsonError, jsonOk, requireAdmin } from '@/lib/api/http'
import type { AdminStats, ListingCategory } from '@/lib/types'

function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const since = new Date()
  since.setDate(since.getDate() - 30)
  const prev = new Date(since)
  prev.setDate(prev.getDate() - 30)

  const [
    users,
    listings,
    reports,
    payments,
    recentListings,
    previousListings,
    recentUsers,
    previousUsers,
    previousReports,
    previousPayments,
  ] = await Promise.all([
    auth.supabase.from('profiles').select('id', { count: 'exact', head: true }),
    auth.supabase.from('listings').select('id, category', { count: 'exact' }).eq('status', 'active'),
    auth.supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    auth.supabase.from('payments').select('amount, status').eq('status', 'paid'),
    auth.supabase.from('listings').select('id', { count: 'exact', head: true }).gte('created_at', since.toISOString()),
    auth.supabase.from('listings').select('id', { count: 'exact', head: true }).gte('created_at', prev.toISOString()).lt('created_at', since.toISOString()),
    auth.supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since.toISOString()),
    auth.supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', prev.toISOString()).lt('created_at', since.toISOString()),
    auth.supabase.from('reports').select('id', { count: 'exact', head: true }).gte('created_at', prev.toISOString()).lt('created_at', since.toISOString()),
    auth.supabase.from('payments').select('amount').eq('status', 'paid').gte('created_at', prev.toISOString()).lt('created_at', since.toISOString()),
  ])

  if (users.error) return dbError(users.error, 'Unable to load admin stats.')

  const { data: activityRows } = await auth.supabase
    .from('listings')
    .select('created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  const days = Array.from({ length: 30 }, (_, index) => {
    const day = new Date()
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - (29 - index))
    return day.toISOString().slice(0, 10)
  })
  const counts = new Map(days.map((day) => [day, 0]))
  for (const row of activityRows ?? []) {
    const key = row.created_at.slice(0, 10)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const activity = days.map((day) => counts.get(day) ?? 0)
  const max = Math.max(1, ...activity)

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
    users_change: percentChange(recentUsers.count ?? 0, previousUsers.count ?? 0),
    listings_change: percentChange(recentListings.count ?? 0, previousListings.count ?? 0),
    reports_change: percentChange(reports.count ?? 0, previousReports.count ?? 0),
    volume_change: percentChange(grossVolume, prevVolume),
    activity: activity.map((value) => Math.round((value / max) * 145) || 8),
    by_category,
  }

  if (!Number.isFinite(data.users_change)) data.users_change = 0
  return jsonOk({ data })
}

export async function POST() {
  return jsonError('Method not allowed.', 405)
}
