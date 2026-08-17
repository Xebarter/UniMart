import { writeAudit } from '@/lib/admin/audit'
import { dbError, jsonError, jsonOk, requireAdmin } from '@/lib/api/http'
import type { Profile } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const [{ data: conversation, error }, { data: messages }, { data: members }] = await Promise.all([
    auth.supabase.from('conversations').select('id, listing_id, created_at, updated_at, listing:listings(id, title, price, category)').eq('id', id).maybeSingle(),
    auth.supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }),
    auth.supabase.from('conversation_members').select('conversation_id, user_id').eq('conversation_id', id),
  ])
  if (error) return dbError(error, 'Unable to load conversation.')
  if (!conversation) return jsonError('Conversation not found.', 404)

  const memberIds = (members ?? []).map((member) => member.user_id)
  const { data: profiles } = memberIds.length
    ? await auth.supabase.from('profiles').select('id, display_name, avatar_url').in('id', memberIds)
    : { data: [] as Pick<Profile, 'id' | 'display_name' | 'avatar_url'>[] }
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  await writeAudit(auth.supabase, {
    actorId: auth.user.id,
    action: 'message.view',
    entityType: 'conversation',
    entityId: id,
  })

  return jsonOk({
    data: {
      ...conversation,
      conversation_members: (members ?? []).map((member) => ({
        user_id: member.user_id,
        profiles: profileById.get(member.user_id) ?? null,
      })),
    },
    messages: messages ?? [],
  })
}
