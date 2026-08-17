import { createClient } from '@/lib/supabase/server'
import { dbError, jsonError, jsonOk, parseJson, requireUser } from '@/lib/api/http'
import { isCategory } from '@/lib/format'

const LISTING_SELECT = '*, listing_media(*), profiles:owner_id(id, display_name, university, campus, avatar_url, verified)'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('listings').select(LISTING_SELECT).eq('id', id).maybeSingle()
  if (error) return dbError(error, 'Unable to load listing.')
  if (!data) return jsonError('Listing not found.', 404)
  await supabase.rpc('increment_listing_views', { p_listing_id: id })
  return jsonOk({ data })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  const updates: Record<string, unknown> = {}
  if (typeof body.title === 'string') updates.title = body.title.trim()
  if (typeof body.description === 'string') updates.description = body.description.trim()
  if (typeof body.location === 'string') updates.location = body.location.trim()
  if (typeof body.condition === 'string') updates.condition = body.condition
  if (typeof body.category === 'string') {
    if (!isCategory(body.category)) return jsonError('Choose Products, Services, Rentals, or Gigs.')
    updates.category = body.category
  }
  if (body.price != null) {
    const price = Number(body.price)
    if (!Number.isFinite(price) || price < 0) return jsonError('A valid price is required.')
    updates.price = price
  }
  if (typeof body.status === 'string' && ['active', 'sold', 'archived', 'draft'].includes(body.status)) {
    updates.status = body.status
  }
  const { data, error } = await auth.supabase.from('listings').update(updates).eq('id', id).eq('owner_id', auth.user.id).select(LISTING_SELECT).maybeSingle()
  if (error) return dbError(error, 'Unable to update listing.', 400)
  if (!data) return jsonError('Listing not found.', 404)
  return jsonOk({ data })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('listings').update({ status: 'archived' }).eq('id', id).eq('owner_id', auth.user.id).select('id').maybeSingle()
  if (error) return dbError(error, 'Unable to remove listing.', 400)
  if (!data) return jsonError('Listing not found.', 404)
  return jsonOk({ data, archived: true })
}
