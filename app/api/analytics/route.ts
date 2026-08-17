import { dbError, jsonError, jsonOk, parseJson, requireUser } from '@/lib/api/http'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  const eventName = typeof body.event_name === 'string' ? body.event_name.trim() : ''
  if (!eventName || eventName.length > 100) return jsonError('event_name is required.')
  const { error } = await supabase.from('analytics_events').insert({
    user_id: user?.id ?? null,
    event_name: eventName,
    listing_id: typeof body.listing_id === 'string' ? body.listing_id : null,
    metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
  })
  if (error) return dbError(error, 'Unable to record event.', 400)
  return jsonOk({ recorded: true }, 201)
}

export async function GET() {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { data: admin } = await auth.supabase.rpc('is_admin')
  if (!admin) return jsonError('Admin access required.', 403)
  const { data, error } = await auth.supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(200)
  if (error) return dbError(error, 'Unable to load analytics.')
  return jsonOk({ data: data ?? [] })
}
