import { ilikeOr, sanitizeSearch } from '@/lib/admin/query'
import { createClient } from '@/lib/supabase/server'
import { dbError, jsonError, jsonOk, parseJson, rejectIfMissingContactPhone, rejectIfMissingStudentNumber, rejectIfRestricted, requireUser } from '@/lib/api/http'
import { CONTACT_PHONE_SHOP_REQUIRED, isPhoneRequiredError } from '@/lib/phone'
import { isStudentNumberRequiredError, STUDENT_NUMBER_SHOP_REQUIRED } from '@/lib/student-number'
import { slugifyShopName } from '@/lib/shop'
import type { Shop } from '@/lib/types'

type Supabase = Awaited<ReturnType<typeof createClient>>

const SHOP_SELECT = '*, profiles:owner_id(id, display_name, university, campus, avatar_url, verified, phone_primary, phone_secondary)'

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  excludeId?: string,
) {
  let slug = base
  for (let index = 0; index < 30; index += 1) {
    let query = supabase.from('shops').select('id').eq('slug', slug)
    if (excludeId) query = query.neq('id', excludeId)
    const { data } = await query.maybeSingle()
    if (!data) return slug
    slug = `${base}-${index + 2}`.slice(0, 60)
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`
}

function shopFields(body: Record<string, unknown>, { requireName }: { requireName: boolean }) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const bio = typeof body.bio === 'string' ? body.bio.trim().slice(0, 400) || null : undefined
  const coverUrl = typeof body.cover_url === 'string' ? body.cover_url.trim() || null : undefined
  const requestedSlug = typeof body.slug === 'string' ? slugifyShopName(body.slug) : name ? slugifyShopName(name) : ''
  const error = requireName && (name.length < 2 || name.length > 80)
    ? 'Give your shop a name between 2 and 80 characters.'
    : ''
  return { name, bio, coverUrl, requestedSlug, error }
}

async function enrichShops(supabase: Supabase, shops: Shop[], userId?: string | null) {
  if (!shops.length) return []

  const shopIds = shops.map((shop) => shop.id)
  const ownerIds = shops.map((shop) => shop.owner_id)

  const [{ data: listings }, { data: follows }] = await Promise.all([
    supabase.from('listings').select('shop_id').in('shop_id', shopIds).eq('status', 'active'),
    supabase.from('follows').select('following_id').in('following_id', ownerIds),
  ])

  const listingCounts = new Map<string, number>()
  for (const row of listings ?? []) {
    if (row.shop_id) listingCounts.set(row.shop_id, (listingCounts.get(row.shop_id) ?? 0) + 1)
  }

  const followerCounts = new Map<string, number>()
  for (const row of follows ?? []) {
    followerCounts.set(row.following_id, (followerCounts.get(row.following_id) ?? 0) + 1)
  }

  let followingSet = new Set<string>()
  if (userId) {
    const { data: myFollows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)
      .in('following_id', ownerIds)
    followingSet = new Set((myFollows ?? []).map((row) => row.following_id))
  }

  return shops.map((shop) => ({
    ...shop,
    listing_count: listingCounts.get(shop.id) ?? 0,
    follower_count: followerCounts.get(shop.owner_id) ?? 0,
    following: userId ? followingSet.has(shop.owner_id) : false,
  }))
}

async function browseShops(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const q = sanitizeSearch(searchParams.get('q'))
  const limit = Math.min(Number(searchParams.get('limit') ?? 12) || 12, 48)
  const offset = Math.max(Number(searchParams.get('offset') ?? 0) || 0, 0)

  let query = supabase.from('shops').select(SHOP_SELECT).order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  query = query.eq('status', 'active')
  if (q) query = query.or(ilikeOr(['name', 'slug', 'bio'], q))

  let { data, error } = await query
  if (error && /status/i.test(error.message ?? '')) {
    let fallback = supabase.from('shops').select(SHOP_SELECT).order('created_at', { ascending: false }).range(offset, offset + limit - 1)
    if (q) fallback = fallback.or(ilikeOr(['name', 'slug', 'bio'], q))
    const result = await fallback
    data = result.data
    error = result.error
  }
  if (error) return dbError(error, 'Unable to load shops.')

  const { data: { user } } = await supabase.auth.getUser()
  const enriched = await enrichShops(supabase, (data ?? []) as Shop[], user?.id)
  return jsonOk({ data: enriched })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get('owner_id')
  if (ownerId) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('shops').select(SHOP_SELECT).eq('owner_id', ownerId).maybeSingle()
    if (error) return dbError(error, 'Unable to load shop.')
    return jsonOk({ data: data ?? null })
  }

  const q = sanitizeSearch(searchParams.get('q'))
  const limitParam = searchParams.get('limit')
  if (limitParam !== null || q) return browseShops(request)

  const auth = await requireUser()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('shops').select(SHOP_SELECT).eq('owner_id', auth.user.id).maybeSingle()
  if (error) return dbError(error, 'Unable to load shop.')
  return jsonOk({ data: data ?? null })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const restricted = await rejectIfRestricted(auth.supabase, auth.user.id)
  if (restricted) return restricted
  const missingStudent = await rejectIfMissingStudentNumber(auth.supabase, auth.user.id, STUDENT_NUMBER_SHOP_REQUIRED)
  if (missingStudent) return missingStudent
  const missingPhone = await rejectIfMissingContactPhone(auth.supabase, auth.user.id, CONTACT_PHONE_SHOP_REQUIRED)
  if (missingPhone) return missingPhone
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  const fields = shopFields(body, { requireName: true })
  if (fields.error) return jsonError(fields.error)

  const { data: existing } = await auth.supabase.from('shops').select('id').eq('owner_id', auth.user.id).maybeSingle()
  if (existing) return jsonError('You already have a shop.', 409)

  const slug = await uniqueSlug(auth.supabase, fields.requestedSlug)
  const { data, error } = await auth.supabase
    .from('shops')
    .insert({
      owner_id: auth.user.id,
      name: fields.name,
      slug,
      bio: fields.bio ?? null,
      cover_url: fields.coverUrl ?? null,
    })
    .select(SHOP_SELECT)
    .single()
  if (isStudentNumberRequiredError(error)) return jsonError(STUDENT_NUMBER_SHOP_REQUIRED, 403)
  if (isPhoneRequiredError(error)) return jsonError(CONTACT_PHONE_SHOP_REQUIRED, 403)
  if (error) return dbError(error, 'Unable to open your shop.', 400)
  return jsonOk({ data: data as Shop }, 201)
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  const fields = shopFields(body, { requireName: typeof body.name === 'string' })
  if (fields.error) return jsonError(fields.error)

  const { data: current } = await auth.supabase.from('shops').select('id').eq('owner_id', auth.user.id).maybeSingle()
  if (!current) return jsonError('Open a shop first.', 404)

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.name === 'string') updates.name = fields.name
  if (fields.bio !== undefined) updates.bio = fields.bio
  if (fields.coverUrl !== undefined) updates.cover_url = fields.coverUrl
  if (typeof body.slug === 'string' || typeof body.name === 'string') {
    updates.slug = await uniqueSlug(auth.supabase, fields.requestedSlug || 'shop', current.id)
  }

  const { data, error } = await auth.supabase.from('shops').update(updates).eq('id', current.id).select(SHOP_SELECT).single()
  if (error) return dbError(error, 'Unable to update shop.', 400)
  return jsonOk({ data: data as Shop })
}
