import { dbError, jsonError, jsonOk, parseJson, requireUser } from '@/lib/api/http'
import { loadNotificationPreferences, saveNotificationPreferences } from '@/lib/notifications'
import { NOTIFICATION_TYPES, type NotificationPreferences, type NotificationType } from '@/lib/types'

export async function GET(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response

  const url = new URL(request.url)
  const type = url.searchParams.get('type')
  const unreadOnly = url.searchParams.get('unread') === '1'
  const before = url.searchParams.get('before')
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 50), 1), 100)

  let builder = auth.supabase
    .from('notifications')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (unreadOnly) builder = builder.is('read_at', null)
  if (type && NOTIFICATION_TYPES.includes(type as NotificationType)) builder = builder.eq('type', type)
  if (before) builder = builder.lt('created_at', before)

  const [{ data, error }, { count }, preferences] = await Promise.all([
    builder,
    auth.supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', auth.user.id).is('read_at', null),
    loadNotificationPreferences(auth.supabase, auth.user.id),
  ])
  if (error) return dbError(error, 'Unable to load notifications.')
  return jsonOk({ data: data ?? [], unread: count ?? 0, preferences })
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson<{ all?: boolean; id?: string }>(request)
  if (!body?.all && !body?.id) return jsonError('Provide an id or set all=true.')
  let builder = auth.supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', auth.user.id).is('read_at', null)
  if (body?.id) builder = builder.eq('id', body.id)
  const { data, error } = await builder.select('id')
  if (error) return dbError(error, 'Unable to update notifications.', 400)
  return jsonOk({ read: data?.length ?? 0 })
}

export async function PUT(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson<Partial<NotificationPreferences>>(request)
  if (!body) return jsonError('Invalid JSON body.')
  try {
    const preferences = await saveNotificationPreferences(auth.supabase, auth.user.id, {
      push_enabled: typeof body.push_enabled === 'boolean' ? body.push_enabled : undefined,
      push_messages: typeof body.push_messages === 'boolean' ? body.push_messages : undefined,
      push_sales: typeof body.push_sales === 'boolean' ? body.push_sales : undefined,
      push_favorites: typeof body.push_favorites === 'boolean' ? body.push_favorites : undefined,
      push_follows: typeof body.push_follows === 'boolean' ? body.push_follows : undefined,
      push_report_updates: typeof body.push_report_updates === 'boolean' ? body.push_report_updates : undefined,
      push_account_notices: typeof body.push_account_notices === 'boolean' ? body.push_account_notices : undefined,
    })
    return jsonOk({ preferences })
  } catch (error) {
    return dbError(error as { message?: string; code?: string }, 'Unable to update notification preferences.', 400)
  }
}
