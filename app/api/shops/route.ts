import { createClient } from '@/lib/supabase/server'
import { dbError, jsonError, jsonOk, parseJson, rejectIfRestricted, requireUser } from '@/lib/api/http'
import { slugifyShopName } from '@/lib/shop'
import type { Shop } from '@/lib/types'

const SHOP_SELECT = '*, profiles:owner_id(id, display_name, university, campus, avatar_url, verified)'

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

export async function GET(request: Request) {
  const ownerId = new URL(request.url).searchParams.get('owner_id')
  if (ownerId) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('shops').select(SHOP_SELECT).eq('owner_id', ownerId).maybeSingle()
    if (error) return dbError(error, 'Unable to load shop.')
    return jsonOk({ data: data ?? null })
  }

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
