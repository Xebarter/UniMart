import { writeAudit } from '@/lib/admin/audit'
import { ilikeOr, parseListQuery } from '@/lib/admin/query'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'
import { createNotification } from '@/lib/notifications'

const SELECT = '*, profiles:owner_id(id, display_name, university, campus, avatar_url, verified, phone_primary, phone_secondary), listing_media(*)'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { page, pageSize, q, from, to, searchParams } = parseListQuery(new URL(request.url))
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const featured = searchParams.get('featured')

  let query = auth.supabase.from('listings').select(SELECT, { count: 'exact' })
  if (status && status !== 'all') query = query.eq('status', status)
  if (category && ['Products', 'Services', 'Rentals', 'Gigs'].includes(category)) query = query.eq('category', category)
  if (featured === '1') query = query.gt('featured_until', new Date().toISOString())
  if (q) query = query.or(ilikeOr(['title', 'description', 'location'], q))

  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) return dbError(error, 'Unable to load listings.')
  return jsonOk({ data: data ?? [], total: count ?? 0, page, pageSize })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson<{ id?: string; status?: string; featured_until?: string | null }>(request)
  if (!body?.id) return jsonError('id is required.')

  const updates: Record<string, unknown> = {}
  if (body.status) {
    if (!['active', 'sold', 'archived', 'removed', 'pending', 'draft'].includes(body.status)) return jsonError('Invalid status.')
    updates.status = body.status
  }
  if (body.featured_until === null) updates.featured_until = null
  if (!Object.keys(updates).length) return jsonError('No updates provided.')

  const { data, error } = await auth.supabase.from('listings').update(updates).eq('id', body.id).select().single()
  if (error) return dbError(error, 'Unable to update listing.', 400)
  await writeAudit(auth.supabase, { actorId: auth.user.id, action: 'listing.moderate', entityType: 'listing', entityId: body.id, metadata: updates })
  if (typeof updates.status === 'string') {
    await createNotification(auth.supabase, {
      user_id: data.owner_id,
      type: 'account_notice',
      title: 'Your listing status changed',
      body: `${data.title} is now ${updates.status}.`,
      listing_id: data.id,
      actor_id: auth.user.id,
      path: `/listings/${data.id}`,
      metadata: { status: updates.status, listing_title: data.title },
    }).catch((notificationError) => console.error('[unimart:listings:notify]', notificationError))
  }
  return jsonOk({ data })
}
