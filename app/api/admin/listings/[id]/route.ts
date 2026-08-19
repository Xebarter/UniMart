import { dbError, jsonError, jsonOk, requireAdmin } from '@/lib/api/http'

type Params = { params: Promise<{ id: string }> }

const SELECT = '*, profiles:owner_id(id, display_name, university, campus, avatar_url, verified, phone_primary, phone_secondary), listing_media(*)'

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const [{ data, error }, reports, payments] = await Promise.all([
    auth.supabase.from('listings').select(SELECT).eq('id', id).maybeSingle(),
    auth.supabase.from('reports').select('*').eq('listing_id', id).order('created_at', { ascending: false }),
    auth.supabase.from('payments').select('*').eq('listing_id', id).order('created_at', { ascending: false }),
  ])
  if (error) return dbError(error, 'Unable to load listing.')
  if (!data) return jsonError('Listing not found.', 404)
  return jsonOk({ data, reports: reports.data ?? [], payments: payments.data ?? [] })
}
