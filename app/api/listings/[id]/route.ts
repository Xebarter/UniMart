import { createClient } from '@/lib/supabase/server'
import { dbError, jsonError, jsonOk, parseJson, rejectIfMissingStudentNumber, requireUser } from '@/lib/api/http'
import { isCategory, isRentPeriod } from '@/lib/format'
import { gigContactAccess, redactGigPhones } from '@/lib/gigs'
import {
  isStudentNumberRequiredError,
  needsStudentNumber,
  STUDENT_NUMBER_LISTING_REQUIRED,
} from '@/lib/student-number'
import type { Listing } from '@/lib/types'

const LISTING_SELECT = '*, listing_media(*), profiles:owner_id(id, display_name, university, campus, avatar_url, verified, phone_primary, phone_secondary)'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('listings').select(LISTING_SELECT).eq('id', id).maybeSingle()
  if (error) return dbError(error, 'Unable to load listing.')
  if (!data) return jsonError('Listing not found.', 404)
  await supabase.rpc('increment_listing_views', { p_listing_id: id })
  const { data: { user } } = await supabase.auth.getUser()
  const access = await gigContactAccess(supabase, user?.id)
  return jsonOk({ data: redactGigPhones(data as Listing, access) })
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
    if (body.category !== 'Rentals') updates.rent_period = null
  }
  if (body.rent_period === null) {
    updates.rent_period = null
  } else if (typeof body.rent_period === 'string') {
    if (!isRentPeriod(body.rent_period)) return jsonError('Choose per day, per week, or per month.')
    updates.rent_period = body.rent_period
  }
  if (updates.category && updates.category !== 'Rentals') updates.rent_period = null
  if (body.price != null) {
    const price = Number(body.price)
    if (!Number.isFinite(price) || price < 0) return jsonError('A valid price is required.')
    updates.price = price
  }
  if (typeof body.status === 'string' && ['active', 'unavailable', 'sold', 'archived', 'draft'].includes(body.status)) {
    updates.status = body.status
  }
  if (body.shop_id === null) {
    updates.shop_id = null
  } else if (typeof body.shop_id === 'string') {
    const { data: shop } = await auth.supabase.from('shops').select('id').eq('id', body.shop_id).eq('owner_id', auth.user.id).maybeSingle()
    if (!shop) return jsonError('Open a shop first, then add listings to it.')
    updates.shop_id = shop.id
  }
  if (!Object.keys(updates).length) return jsonError('Nothing to update.')
  if (typeof updates.category === 'string' && needsStudentNumber(updates.category)) {
    const { data: current } = await auth.supabase.from('listings').select('category').eq('id', id).eq('owner_id', auth.user.id).maybeSingle()
    if (current && !needsStudentNumber(current.category)) {
      const missing = await rejectIfMissingStudentNumber(auth.supabase, auth.user.id, STUDENT_NUMBER_LISTING_REQUIRED)
      if (missing) return missing
    }
  }
  const { data, error } = await auth.supabase.from('listings').update(updates).eq('id', id).eq('owner_id', auth.user.id).select(LISTING_SELECT).maybeSingle()
  if (isStudentNumberRequiredError(error)) return jsonError(STUDENT_NUMBER_LISTING_REQUIRED, 403)
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
