import { createClient } from '@/lib/supabase/server'
import { dbError, jsonError, jsonOk } from '@/lib/api/http'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('id, display_name, university, campus, bio, avatar_url, verified, created_at').eq('id', id).maybeSingle()
  if (error) return dbError(error, 'Unable to load profile.')
  if (!data) return jsonError('Profile not found.', 404)
  const { data: listings } = await supabase.from('listings').select('*, listing_media(*)').eq('owner_id', id).eq('status', 'active').order('created_at', { ascending: false })
  return jsonOk({ data, listings: listings ?? [] })
}
