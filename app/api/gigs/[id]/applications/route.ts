import { dbError, jsonError, jsonOk, requireUser } from '@/lib/api/http'
import { isGigListing } from '@/lib/gigs'
import type { GigApplication } from '@/lib/types'

const APPLICATION_SELECT = '*, profiles:applicant_id(id, display_name, avatar_url, university, campus)'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireUser()
  if (auth.response) return auth.response

  const { data: listing, error: listingError } = await auth.supabase
    .from('listings')
    .select('id, owner_id, category')
    .eq('id', id)
    .maybeSingle()
  if (listingError) return dbError(listingError, 'Unable to load this gig.')
  if (!listing || !isGigListing(listing)) return jsonError('This listing is not a gig.', 404)

  const isOwner = listing.owner_id === auth.user.id
  let query = auth.supabase.from('gig_applications').select(APPLICATION_SELECT).eq('listing_id', id).order('created_at', { ascending: false })
  if (!isOwner) query = query.eq('applicant_id', auth.user.id)

  const { data, error } = await query
  if (error) return dbError(error, 'Unable to load applications.')
  const applications = (data ?? []) as GigApplication[]
  return jsonOk({
    data: isOwner ? applications : [],
    mine: applications.find((item) => item.applicant_id === auth.user.id) ?? null,
    count: isOwner ? applications.length : applications.length ? 1 : 0,
  })
}
