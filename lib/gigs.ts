import { hasStudentNumber } from '@/lib/student-number'
import type { Listing } from '@/lib/types'
import type { createClient as createServerSupabase } from '@/lib/supabase/server'

type Supabase = Awaited<ReturnType<typeof createServerSupabase>>

export const GIG_RESUME_MAX_BYTES = 5 * 1024 * 1024
export const GIG_RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const
export const GIG_RESUME_EXTENSIONS = ['pdf', 'doc', 'docx'] as const

type ListingWithOwner = Pick<Listing, 'category' | 'owner_id'> & {
  profiles?: Listing['profiles']
}

export function isGigListing(listing: { category?: string } | null | undefined) {
  return listing?.category === 'Gigs'
}

export function resumeExtension(fileName: string, mime = '') {
  const fromName = fileName.split('.').pop()?.toLowerCase() ?? ''
  if ((GIG_RESUME_EXTENSIONS as readonly string[]).includes(fromName)) return fromName
  if (mime === 'application/pdf') return 'pdf'
  if (mime === 'application/msword') return 'doc'
  if (mime.includes('wordprocessingml')) return 'docx'
  return ''
}

export function isAllowedResume(file: File) {
  if (file.size > GIG_RESUME_MAX_BYTES) return 'Upload a resume under 5MB.'
  const extension = resumeExtension(file.name, file.type)
  if (!extension) return 'Use a PDF or Word document.'
  if (file.type && !(GIG_RESUME_TYPES as readonly string[]).includes(file.type) && !file.type.startsWith('application/')) {
    return 'Use a PDF or Word document.'
  }
  return ''
}

export function redactGigPhones<T extends ListingWithOwner>(
  listing: T,
  access: { viewerId?: string | null; student?: boolean },
): T {
  if (!isGigListing(listing)) return listing
  if (access.viewerId && listing.owner_id === access.viewerId) return listing
  if (access.student) return listing
  if (!listing.profiles) return listing
  return {
    ...listing,
    profiles: {
      ...listing.profiles,
      phone_primary: null,
      phone_secondary: null,
    },
  }
}

export async function gigContactAccess(supabase: Supabase, userId?: string | null) {
  if (!userId) return { viewerId: null as string | null, student: false }
  const { data } = await supabase.from('profiles').select('student_number').eq('id', userId).maybeSingle()
  return { viewerId: userId, student: hasStudentNumber(data?.student_number) }
}
