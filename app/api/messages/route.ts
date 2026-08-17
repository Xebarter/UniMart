import { dbError, jsonError, jsonOk, parseJson, rejectIfRestricted, requireUser } from '@/lib/api/http'

export async function GET(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const conversationId = new URL(request.url).searchParams.get('conversation_id')
  if (!conversationId) return jsonError('conversation_id is required.')
  const { data, error } = await auth.supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true })
  if (error) return dbError(error, 'Unable to load messages.')
  return jsonOk({ data: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const restricted = await rejectIfRestricted(auth.supabase, auth.user.id)
  if (restricted) return restricted
  const body = await parseJson<{ conversation_id?: string; body?: string }>(request)
  const conversationId = typeof body?.conversation_id === 'string' ? body.conversation_id : ''
  const message = typeof body?.body === 'string' ? body.body.trim() : ''
  if (!conversationId || !message || message.length > 4000) return jsonError('A conversation and message are required.')
  const { data, error } = await auth.supabase.from('messages').insert({ conversation_id: conversationId, sender_id: auth.user.id, body: message }).select().single()
  if (error) return dbError(error, 'Unable to send message.', 400)
  return jsonOk({ data }, 201)
}
