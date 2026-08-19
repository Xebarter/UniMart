import { dbError, jsonError, jsonOk, rejectIfMissingContactPhone, rejectIfMissingStudentNumber, rejectIfRestricted, requireUser } from '@/lib/api/http'
import { GIG_RESUME_MAX_BYTES, isGigListing, resumeExtension } from '@/lib/gigs'
import { CONTACT_PHONE_GIG_REQUIRED } from '@/lib/phone'
import { hasStudentNumber, STUDENT_NUMBER_GIG_REQUIRED } from '@/lib/student-number'
import type { GigApplication } from '@/lib/types'

const APPLICATION_SELECT = '*, profiles:applicant_id(id, display_name, avatar_url, university, campus)'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireUser()
  if (auth.response) return auth.response
  const restricted = await rejectIfRestricted(auth.supabase, auth.user.id)
  if (restricted) return restricted

  const missingStudent = await rejectIfMissingStudentNumber(auth.supabase, auth.user.id, STUDENT_NUMBER_GIG_REQUIRED)
  if (missingStudent) return missingStudent
  const missingPhone = await rejectIfMissingContactPhone(auth.supabase, auth.user.id, CONTACT_PHONE_GIG_REQUIRED)
  if (missingPhone) return missingPhone

  const { data: listing, error: listingError } = await auth.supabase
    .from('listings')
    .select('id, owner_id, title, category, status')
    .eq('id', id)
    .maybeSingle()
  if (listingError) return dbError(listingError, 'Unable to load this gig.')
  if (!listing || !isGigListing(listing)) return jsonError('This listing is not a gig.', 404)
  if (listing.status !== 'active') return jsonError('This gig is no longer accepting applications.', 400)
  if (listing.owner_id === auth.user.id) return jsonError('You cannot apply to your own gig.')

  const form = await request.formData()
  const coverLetter = String(form.get('cover_letter') ?? '').trim()
  if (coverLetter.length < 40) return jsonError('Tell the poster a little more about how you would do this gig.')
  if (coverLetter.length > 4000) return jsonError('Keep your note under 4,000 characters.')
  const file = form.get('resume')
  if (!(file instanceof File)) return jsonError('Upload a resume to apply.')
  if (file.size > GIG_RESUME_MAX_BYTES) return jsonError('Upload a resume under 5MB.')
  const extension = resumeExtension(file.name, file.type)
  if (!extension) return jsonError('Use a PDF or Word document.')

  const { data: existing } = await auth.supabase
    .from('gig_applications')
    .select(APPLICATION_SELECT)
    .eq('listing_id', id)
    .eq('applicant_id', auth.user.id)
    .maybeSingle()
  if (existing) {
    return jsonOk({ data: existing as GigApplication, conversation_id: existing.conversation_id, already: true })
  }

  const { data: profile, error: profileError } = await auth.supabase
    .from('profiles')
    .select('display_name, university, campus, student_number, phone_primary')
    .eq('id', auth.user.id)
    .maybeSingle()
  if (profileError || !profile) return dbError(profileError, 'Unable to load your profile.')
  if (!hasStudentNumber(profile.student_number)) return jsonError(STUDENT_NUMBER_GIG_REQUIRED, 403)

  const resumePath = `${auth.user.id}/${id}/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await auth.supabase.storage.from('gig-resumes').upload(resumePath, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (uploadError) return jsonError('Unable to upload your resume. Try again.')

  const { data: conversationId, error: conversationError } = await auth.supabase.rpc('get_or_create_conversation', {
    p_recipient: listing.owner_id,
    p_listing: id,
  })
  if (conversationError || !conversationId) {
    await auth.supabase.storage.from('gig-resumes').remove([resumePath])
    return dbError(conversationError, 'Unable to start a conversation with the poster.', 400)
  }

  const snapshot = {
    listing_id: id,
    applicant_id: auth.user.id,
    conversation_id: conversationId as string,
    cover_letter: coverLetter,
    resume_path: resumePath,
    name: profile.display_name || 'UniMart member',
    email: auth.user.email?.trim().toLowerCase() || '',
    phone: profile.phone_primary || '',
    student_number: profile.student_number || '',
    university: profile.university || '',
    campus: profile.campus || '',
    status: 'submitted' as const,
  }

  const { data: application, error: applyError } = await auth.supabase
    .from('gig_applications')
    .insert(snapshot)
    .select(APPLICATION_SELECT)
    .single()

  if (applyError) {
    await auth.supabase.storage.from('gig-resumes').remove([resumePath])
    if (applyError.code === '23505') {
      const { data: duplicate } = await auth.supabase
        .from('gig_applications')
        .select(APPLICATION_SELECT)
        .eq('listing_id', id)
        .eq('applicant_id', auth.user.id)
        .maybeSingle()
      if (duplicate) return jsonOk({ data: duplicate as GigApplication, conversation_id: duplicate.conversation_id, already: true })
    }
    return dbError(applyError, 'Unable to submit your application.', 400)
  }

  const { error: messageError } = await auth.supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: auth.user.id,
    body: coverLetter.slice(0, 4000),
    kind: 'gig_application',
    application_id: application.id,
  })
  if (messageError) return dbError(messageError, 'Application saved, but we could not notify the poster.', 400)

  return jsonOk({ data: application as GigApplication, conversation_id: conversationId as string, already: false }, 201)
}
