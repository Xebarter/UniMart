import { createClient } from '@/lib/supabase/server'
import { dbError, jsonError, jsonOk, parseJson, rejectIfRestricted, requireUser } from '@/lib/api/http'
import { isCategory, isRentPeriod } from '@/lib/format'

const LISTING_SELECT = '*, listing_media(*), profiles:owner_id(id, display_name, university, campus, avatar_url, verified)'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const query = searchParams.get('q')?.trim()
  const mine = searchParams.get('mine') === '1'
  const ownerId = searchParams.get('owner_id')
  const status = searchParams.get('status')
  const limit = Math.min(Number(searchParams.get('limit') ?? 48) || 48, 100)
  const offset = Math.max(Number(searchParams.get('offset') ?? 0) || 0, 0)

  let builder = supabase.from('listings').select(LISTING_SELECT).range(offset, offset + limit - 1)

  if (mine) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonError('Authentication required.', 401)
    builder = builder.eq('owner_id', user.id)
  } else if (ownerId) {
    builder = builder.eq('owner_id', ownerId)
  }

  if (status === 'all') {
    const { data: admin } = await supabase.rpc('is_admin')
    if (!admin) return jsonError('Admin access required.', 403)
  } else if (status) {
    builder = builder.eq('status', status)
  } else if (!mine) {
    builder = builder.eq('status', 'active')
  }

  if (category && category !== 'All') builder = builder.eq('category', category)
  if (query) {
    const safeQuery = query.replace(/[%,()]/g, '').slice(0, 80)
    if (safeQuery) builder = builder.or(`title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,location.ilike.%${safeQuery}%`)
  }

  builder = builder.order('featured_until', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
  const { data, error } = await builder
  if (error) return dbError(error, 'Unable to load listings.')
  return jsonOk({ data: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const restricted = await rejectIfRestricted(auth.supabase, auth.user.id)
  if (restricted) return restricted
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const category = typeof body.category === 'string' ? body.category : ''
  const location = typeof body.location === 'string' ? body.location.trim() : ''
  const price = Number(body.price)
  if (!title || title.length > 120) return jsonError('A title up to 120 characters is required.')
  if (!isCategory(category)) return jsonError('Choose Products, Services, Rentals, or Gigs.')
  if (!Number.isFinite(price) || price < 0) return jsonError('A valid price is required.')
  const rentPeriod = category === 'Rentals'
    ? (typeof body.rent_period === 'string' && isRentPeriod(body.rent_period) ? body.rent_period : 'month')
    : null
  let shopId: string | null = null
  if (typeof body.shop_id === 'string' && body.shop_id.trim()) {
    const { data: shop } = await auth.supabase.from('shops').select('id').eq('id', body.shop_id).eq('owner_id', auth.user.id).maybeSingle()
    if (!shop) return jsonError('Shop not found.')
    shopId = shop.id
  }
  const { data, error } = await auth.supabase
    .from('listings')
    .insert({
      owner_id: auth.user.id,
      title,
      description,
      category,
      price,
      location,
      condition: typeof body.condition === 'string' ? body.condition : 'good',
      rent_period: rentPeriod,
      status: 'active',
      ...(shopId ? { shop_id: shopId } : {}),
    })
    .select(LISTING_SELECT)
    .single()
  if (error) return dbError(error, 'Unable to create listing.', 400)
  return jsonOk({ data }, 201)
}
