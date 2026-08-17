import { dbError, jsonError, jsonOk, parseJson, requireUser } from '@/lib/api/http'

export async function GET() {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase
    .from('notifications')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return dbError(error, 'Unable to load notifications.')
  const unread = (data ?? []).filter((item) => !item.read_at).length
  return jsonOk({ data: data ?? [], unread })
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson<{ all?: boolean; id?: string }>(request)
  let builder = auth.supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', auth.user.id).is('read_at', null)
  if (body?.id) builder = builder.eq('id', body.id)
  const { error } = await builder
  if (error) return dbError(error, 'Unable to update notifications.', 400)
  return jsonOk({ read: true })
}
