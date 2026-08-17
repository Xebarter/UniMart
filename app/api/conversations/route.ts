import { dbError, jsonError, jsonOk, parseJson, rejectIfRestricted, requireUser } from '@/lib/api/http'
import type { Conversation, Profile } from '@/lib/types'

type MemberRow = {
  conversation_id: string
  user_id: string
  last_read_at: string | null
}

export async function GET() {
  const auth = await requireUser()
  if (auth.response) return auth.response

  const { data: memberships, error: membershipError } = await auth.supabase
    .from('conversation_members')
    .select('conversation_id, last_read_at')
    .eq('user_id', auth.user.id)
  if (membershipError) {
    if (/infinite recursion|42P17/i.test(membershipError.message ?? '')) {
      return jsonOk({ data: [] })
    }
    return dbError(membershipError, 'Unable to load conversations.')
  }

  const ids = (memberships ?? []).map((row) => row.conversation_id)
  if (!ids.length) return jsonOk({ data: [] })

  const lastRead = new Map((memberships ?? []).map((row) => [row.conversation_id, row.last_read_at]))

  const [{ data: conversations, error: conversationError }, { data: members, error: memberError }, { data: messages, error: messageError }] = await Promise.all([
    auth.supabase
      .from('conversations')
      .select('id, listing_id, created_at, updated_at, listing:listings(id, title, price, category)')
      .in('id', ids)
      .order('updated_at', { ascending: false }),
    auth.supabase
      .from('conversation_members')
      .select('conversation_id, user_id, last_read_at')
      .in('conversation_id', ids),
    auth.supabase
      .from('messages')
      .select('id, body, created_at, sender_id, conversation_id')
      .in('conversation_id', ids)
      .order('created_at', { ascending: false }),
  ])

  if (conversationError) return dbError(conversationError, 'Unable to load conversations.')
  if (memberError) return dbError(memberError, 'Unable to load conversations.')
  if (messageError) return dbError(messageError, 'Unable to load conversations.')

  const memberIds = [...new Set(((members ?? []) as MemberRow[]).map((member) => member.user_id))]
  const { data: profiles } = memberIds.length
    ? await auth.supabase.from('profiles').select('id, display_name, avatar_url').in('id', memberIds)
    : { data: [] as Pick<Profile, 'id' | 'display_name' | 'avatar_url'>[] }
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  const membersByConversation = new Map<string, MemberRow[]>()
  for (const member of (members ?? []) as MemberRow[]) {
    const list = membersByConversation.get(member.conversation_id) ?? []
    list.push(member)
    membersByConversation.set(member.conversation_id, list)
  }

  const messagesByConversation = new Map<string, { id: string; body: string; created_at: string; sender_id: string }[]>()
  for (const message of messages ?? []) {
    const list = messagesByConversation.get(message.conversation_id) ?? []
    list.push(message)
    messagesByConversation.set(message.conversation_id, list)
  }

  const data = ((conversations ?? []) as unknown as Conversation[]).map((conversation) => {
    const thread = messagesByConversation.get(conversation.id) ?? []
    const people = membersByConversation.get(conversation.id) ?? []
    const other = people.find((member) => member.user_id !== auth.user.id)
    const readAt = lastRead.get(conversation.id)
    const unread = thread.filter((message) => {
      if (message.sender_id === auth.user.id) return false
      if (!readAt) return true
      return new Date(message.created_at).getTime() > new Date(readAt).getTime()
    }).length
    return {
      ...conversation,
      conversation_members: people.map((member) => ({
        user_id: member.user_id,
        last_read_at: member.last_read_at,
        profiles: profileById.get(member.user_id) ?? null,
      })),
      messages: thread.slice(0, 1).reverse(),
      unread_count: unread,
      other: other ? profileById.get(other.user_id) ?? null : null,
    }
  })

  return jsonOk({ data })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const restricted = await rejectIfRestricted(auth.supabase, auth.user.id)
  if (restricted) return restricted
  const body = await parseJson<{ recipient_id?: string; listing_id?: string | null }>(request)
  const recipientId = typeof body?.recipient_id === 'string' ? body.recipient_id : ''
  if (!recipientId || recipientId === auth.user.id) return jsonError('A valid recipient is required.')
  const { data: conversationId, error } = await auth.supabase.rpc('get_or_create_conversation', {
    p_recipient: recipientId,
    p_listing: body?.listing_id ?? null,
  })
  if (error || !conversationId) return dbError(error, 'Unable to start conversation.', 400)
  const { data: conversation, error: loadError } = await auth.supabase
    .from('conversations')
    .select('id, listing_id, created_at, updated_at, listing:listings(id, title, price, category)')
    .eq('id', conversationId)
    .single()
  if (loadError) return dbError(loadError, 'Unable to start conversation.', 400)
  return jsonOk({ data: conversation }, 201)
}
