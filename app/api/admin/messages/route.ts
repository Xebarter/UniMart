import { parseListQuery } from '@/lib/admin/query'
import { dbError, jsonError, jsonOk, requireAdmin } from '@/lib/api/http'
import type { Profile } from '@/lib/types'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { page, pageSize, q, from, to, searchParams } = parseListQuery(new URL(request.url))
  const userId = searchParams.get('user_id')
  const listingId = searchParams.get('listing_id')
  const kind = searchParams.get('kind')
  const reported = searchParams.get('reported') === '1'

  let conversationIds: string[] | null = null

  if (reported) {
    const { data: reports } = await auth.supabase.from('reports').select('listing_id, reported_user_id').in('status', ['open', 'reviewing'])
    const listingIds = [...new Set((reports ?? []).map((row) => row.listing_id).filter(Boolean))] as string[]
    const userIds = [...new Set((reports ?? []).map((row) => row.reported_user_id).filter(Boolean))] as string[]
    const [byListing, byUser] = await Promise.all([
      listingIds.length ? auth.supabase.from('conversations').select('id').in('listing_id', listingIds) : { data: [] as { id: string }[] },
      userIds.length ? auth.supabase.from('conversation_members').select('conversation_id').in('user_id', userIds) : { data: [] as { conversation_id: string }[] },
    ])
    conversationIds = [...new Set([
      ...(byListing.data ?? []).map((row) => row.id),
      ...(byUser.data ?? []).map((row) => row.conversation_id),
    ])]
    if (!conversationIds.length) return jsonOk({ data: [], total: 0, page, pageSize })
  } else if (userId) {
    const { data: memberships } = await auth.supabase.from('conversation_members').select('conversation_id').eq('user_id', userId)
    conversationIds = (memberships ?? []).map((row) => row.conversation_id)
    if (!conversationIds.length) return jsonOk({ data: [], total: 0, page, pageSize })
  }

  let query = auth.supabase.from('conversations').select('id, listing_id, created_at, updated_at, listing:listings(id, title, price, category)', { count: 'exact' })
  if (conversationIds) query = query.in('id', conversationIds)
  if (listingId) query = query.eq('listing_id', listingId)
  if (kind === 'listing') query = query.not('listing_id', 'is', null)
  if (kind === 'direct') query = query.is('listing_id', null)

  const { data: conversations, error, count } = await query.order('updated_at', { ascending: false }).range(from, to)
  if (error) return dbError(error, 'Unable to load conversations.')
  const ids = (conversations ?? []).map((row) => row.id)
  if (!ids.length) return jsonOk({ data: [], total: count ?? 0, page, pageSize })

  const [{ data: members }, { data: messages }] = await Promise.all([
    auth.supabase.from('conversation_members').select('conversation_id, user_id').in('conversation_id', ids),
    auth.supabase.from('messages').select('id, body, created_at, sender_id, conversation_id').in('conversation_id', ids).order('created_at', { ascending: false }),
  ])

  const memberIds = [...new Set((members ?? []).map((member) => member.user_id))]
  const { data: profiles } = memberIds.length
    ? await auth.supabase.from('profiles').select('id, display_name, avatar_url').in('id', memberIds)
    : { data: [] as Pick<Profile, 'id' | 'display_name' | 'avatar_url'>[] }
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  const membersByConversation = new Map<string, typeof members>()
  for (const member of members ?? []) {
    const list = membersByConversation.get(member.conversation_id) ?? []
    list.push(member)
    membersByConversation.set(member.conversation_id, list)
  }
  const previewByConversation = new Map<string, { id: string; body: string; created_at: string; sender_id: string }>()
  for (const message of messages ?? []) {
    if (!previewByConversation.has(message.conversation_id)) previewByConversation.set(message.conversation_id, message)
  }

  const filtered = (conversations ?? []).filter((conversation) => {
    if (!q) return true
    const people = membersByConversation.get(conversation.id) ?? []
    const names = people.map((member) => profileById.get(member.user_id)?.display_name ?? '').join(' ')
    const listing = Array.isArray(conversation.listing) ? conversation.listing[0] : conversation.listing
    const listingTitle = listing?.title ?? ''
    return `${names} ${listingTitle}`.toLowerCase().includes(q.toLowerCase())
  })

  const data = filtered.map((conversation) => {
    const people = (membersByConversation.get(conversation.id) ?? []).map((member) => ({
      user_id: member.user_id,
      profiles: profileById.get(member.user_id) ?? null,
    }))
    const preview = previewByConversation.get(conversation.id)
    return {
      ...conversation,
      conversation_members: people,
      messages: preview ? [preview] : [],
    }
  })

  return jsonOk({ data, total: count ?? data.length, page, pageSize })
}

export async function POST() {
  return jsonError('Method not allowed.', 405)
}
