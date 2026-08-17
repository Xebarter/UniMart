import { parseListQuery, parseRangeDays } from '@/lib/admin/query'
import { dbError, jsonError, jsonOk, requireAdmin } from '@/lib/api/http'
import type { AdminAnalytics, AnalyticsEvent, ListingCategory, ListingMedia } from '@/lib/types'

type SlimEvent = {
  event_name: string
  created_at: string
  user_id: string | null
  listing_id: string | null
}

type ListingRow = {
  id: string
  title: string
  category: ListingCategory
  listing_media?: ListingMedia[] | null
}

type ProfileRow = {
  id: string
  display_name: string
  avatar_url: string | null
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function share(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 1000) / 10
}

function countBy<T>(rows: T[], key: (row: T) => string | null) {
  const map = new Map<string, number>()
  for (const row of rows) {
    const value = key(row)
    if (!value) continue
    map.set(value, (map.get(value) ?? 0) + 1)
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const url = new URL(request.url)
  const { page, pageSize, q, from, to } = parseListQuery(url)
  const event = (url.searchParams.get('event') ?? '').trim()
  const days = parseRangeDays(url.searchParams.get('range'))

  const since = new Date()
  since.setDate(since.getDate() - days)
  const prev = new Date(since)
  prev.setDate(prev.getDate() - days)
  const sinceIso = since.toISOString()
  const prevIso = prev.toISOString()

  let currentQuery = auth.supabase.from('analytics_events').select('event_name, created_at, user_id, listing_id').gte('created_at', sinceIso)
  let previousQuery = auth.supabase.from('analytics_events').select('user_id', { count: 'exact' }).gte('created_at', prevIso).lt('created_at', sinceIso)
  let logQuery = auth.supabase
    .from('analytics_events')
    .select('id, user_id, event_name, listing_id, metadata, created_at, listings(id, title), profiles:user_id(id, display_name, avatar_url)', { count: 'exact' })
    .gte('created_at', sinceIso)
  if (event) {
    currentQuery = currentQuery.eq('event_name', event)
    previousQuery = previousQuery.eq('event_name', event)
    logQuery = logQuery.eq('event_name', event)
  }
  if (q) logQuery = logQuery.ilike('event_name', `%${q}%`)

  const [
    { data: currentRows, error: currentError },
    { data: previousRows, error: previousError, count: previousCount },
    { data: logRows, error: logError, count },
    { data: nameRows },
  ] = await Promise.all([
    currentQuery.order('created_at', { ascending: true }).limit(8000),
    previousQuery.limit(8000),
    logQuery.order('created_at', { ascending: false }).range(from, to),
    auth.supabase.from('analytics_events').select('event_name').gte('created_at', sinceIso).limit(4000),
  ])

  if (currentError) return dbError(currentError, 'Unable to load analytics.')
  if (previousError) return dbError(previousError, 'Unable to load analytics.')
  if (logError) return dbError(logError, 'Unable to load analytics.')

  const current = (currentRows ?? []) as SlimEvent[]
  const previous = (previousRows ?? []) as Pick<SlimEvent, 'user_id'>[]
  const totalEvents = current.length
  const previousEvents = previousCount ?? previous.length

  const uniqueUsers = new Set(current.map((row) => row.user_id).filter(Boolean))
  const previousUsers = new Set(previous.map((row) => row.user_id).filter(Boolean))
  const uniqueListings = new Set(current.map((row) => row.listing_id).filter(Boolean))
  const identified = current.filter((row) => row.user_id).length
  const listingAttributed = current.filter((row) => row.listing_id).length

  const eventCounts = countBy(current, (row) => row.event_name)
  const totals = eventCounts.map(([event_name, countValue]) => ({
    event_name,
    count: countValue,
    percent: `${share(countValue, totalEvents)}%`,
  }))

  const event_names = [...new Set((nameRows ?? []).map((row) => row.event_name).filter(Boolean))].sort()

  const dayKeys = Array.from({ length: days }, (_, index) => {
    const day = new Date()
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - (days - 1 - index))
    return day.toISOString().slice(0, 10)
  })
  const eventsByDay = new Map(dayKeys.map((day) => [day, 0]))
  const usersByDay = new Map(dayKeys.map((day) => [day, new Set<string>()]))
  for (const row of current) {
    const day = row.created_at.slice(0, 10)
    if (!eventsByDay.has(day)) continue
    eventsByDay.set(day, (eventsByDay.get(day) ?? 0) + 1)
    if (row.user_id) usersByDay.get(day)?.add(row.user_id)
  }

  const topListingIds = countBy(current, (row) => row.listing_id).slice(0, 6)
  const topUserIds = countBy(current, (row) => row.user_id).slice(0, 6)

  const [{ data: listingRows }, { data: profileRows }] = await Promise.all([
    topListingIds.length
      ? auth.supabase.from('listings').select('id, title, category, listing_media(*)').in('id', topListingIds.map(([id]) => id))
      : Promise.resolve({ data: [] as ListingRow[] }),
    topUserIds.length
      ? auth.supabase.from('profiles').select('id, display_name, avatar_url').in('id', topUserIds.map(([id]) => id))
      : Promise.resolve({ data: [] as ProfileRow[] }),
  ])

  const listingsById = new Map(((listingRows ?? []) as ListingRow[]).map((row) => [row.id, row]))
  const profilesById = new Map(((profileRows ?? []) as ProfileRow[]).map((row) => [row.id, row]))

  const payload: AdminAnalytics = {
    range_days: days,
    total_events: totalEvents,
    events_change: percentChange(totalEvents, previousEvents),
    unique_users: uniqueUsers.size,
    unique_users_change: percentChange(uniqueUsers.size, previousUsers.size),
    unique_listings: uniqueListings.size,
    event_types: eventCounts.length,
    identified_share: share(identified, totalEvents),
    listing_share: share(listingAttributed, totalEvents),
    activity: dayKeys.map((date) => ({
      date: date.slice(5),
      events: eventsByDay.get(date) ?? 0,
      users: usersByDay.get(date)?.size ?? 0,
    })),
    totals,
    event_names,
    top_listings: topListingIds.map(([id, countValue]) => {
      const listing = listingsById.get(id)
      return {
        id,
        title: listing?.title || 'Deleted listing',
        category: listing?.category ?? 'Products',
        count: countValue,
        listing_media: listing?.listing_media ?? [],
      }
    }),
    top_users: topUserIds.map(([id, countValue]) => {
      const profile = profilesById.get(id)
      return {
        id,
        display_name: profile?.display_name || 'Unknown student',
        avatar_url: profile?.avatar_url ?? null,
        count: countValue,
      }
    }),
    data: (logRows ?? []).map((row) => ({
      ...row,
      listings: firstRelation(row.listings),
      profiles: firstRelation(row.profiles),
    })) as AnalyticsEvent[],
    total: count ?? 0,
    page,
    pageSize,
  }

  if (!Number.isFinite(payload.events_change)) payload.events_change = 0
  if (!Number.isFinite(payload.unique_users_change)) payload.unique_users_change = 0

  return jsonOk(payload)
}

export async function POST() {
  return jsonError('Method not allowed.', 405)
}
