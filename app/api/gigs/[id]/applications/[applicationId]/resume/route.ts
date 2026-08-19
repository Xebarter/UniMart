import { dbError, jsonError, jsonOk, requireUser } from '@/lib/api/http'

type Params = { params: Promise<{ id: string; applicationId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, applicationId } = await params
  const auth = await requireUser()
  if (auth.response) return auth.response

  const { data: application, error } = await auth.supabase
    .from('gig_applications')
    .select('id, listing_id, applicant_id, resume_path')
    .eq('id', applicationId)
    .eq('listing_id', id)
    .maybeSingle()
  if (error) return dbError(error, 'Unable to load this resume.')
  if (!application?.resume_path) return jsonError('Resume not found.', 404)

  const { data: listing } = await auth.supabase.from('listings').select('owner_id').eq('id', id).maybeSingle()
  const allowed = application.applicant_id === auth.user.id || listing?.owner_id === auth.user.id
  if (!allowed) return jsonError('You cannot view this resume.', 403)

  const { data: signed, error: signedError } = await auth.supabase.storage
    .from('gig-resumes')
    .createSignedUrl(application.resume_path, 60)
  if (signedError || !signed?.signedUrl) return jsonError('Unable to open this resume.')
  return jsonOk({ url: signed.signedUrl })
}
