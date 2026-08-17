import { dbError, jsonError, jsonOk, parseJson, requireUser } from '@/lib/api/http'

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson<{ conversation_id?: string }>(request)
  if (!body?.conversation_id) return jsonError('conversation_id is required.')
  const { error } = await auth.supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', body.conversation_id)
    .eq('user_id', auth.user.id)
  if (error) return dbError(error, 'Unable to mark messages as read.', 400)
  return jsonOk({ read: true })
}
