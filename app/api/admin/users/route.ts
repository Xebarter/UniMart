import { writeAudit } from '@/lib/admin/audit'
import { ilikeOr, parseListQuery } from '@/lib/admin/query'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin, requireFullAdmin } from '@/lib/api/http'
import { createNotification } from '@/lib/notifications'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { page, pageSize, q, from, to, searchParams } = parseListQuery(new URL(request.url))
  const role = searchParams.get('role')
  const verified = searchParams.get('verified')
  const status = searchParams.get('status')

  let query = auth.supabase.from('profiles').select('*', { count: 'exact' })
  if (role && ['student', 'moderator', 'admin'].includes(role)) query = query.eq('role', role)
  if (verified === 'true') query = query.eq('verified', true)
  if (verified === 'false') query = query.eq('verified', false)
  if (status && ['active', 'suspended', 'banned'].includes(status)) query = query.eq('account_status', status)
  if (q) query = query.or(ilikeOr(['display_name', 'university', 'campus'], q))

  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error && /account_status/i.test(error.message ?? '')) {
    const fallback = await auth.supabase.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to)
    if (fallback.error) return dbError(fallback.error, 'Unable to load users.')
    return jsonOk({ data: fallback.data ?? [], total: fallback.count ?? 0, page, pageSize })
  }
  if (error) return dbError(error, 'Unable to load users.')
  return jsonOk({ data: data ?? [], total: count ?? 0, page, pageSize })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson<{ id?: string; role?: string; verified?: boolean; account_status?: string }>(request)
  if (!body?.id) return jsonError('id is required.')

  if (body.role) {
    const admin = await requireFullAdmin()
    if (admin.response) return admin.response
    if (!['student', 'moderator', 'admin'].includes(body.role)) return jsonError('Invalid role.')
    const { data, error } = await auth.supabase.rpc('set_user_role', {
      p_user_id: body.id,
      p_role: body.role,
    })
    if (error) {
      const message = error.message || ''
      if (/only admins/i.test(message)) return jsonError('Only admins can change roles.', 403)
      if (/your own admin/i.test(message)) return jsonError('You cannot remove your own admin access.', 400)
      if (/not found/i.test(message)) return jsonError('User not found.', 404)
      return dbError(error, 'Unable to update user role.', 400)
    }
    await writeAudit(auth.supabase, { actorId: auth.user.id, action: 'user.role', entityType: 'user', entityId: body.id, metadata: { role: body.role } })
    await createNotification(auth.supabase, {
      user_id: body.id,
      type: 'account_notice',
      title: 'Your UniMart role changed',
      body: `Your account role is now ${body.role}.`,
      actor_id: auth.user.id,
      path: '/settings',
      metadata: { role: body.role },
    }).catch((notificationError) => console.error('[unimart:users:role-notify]', notificationError))
    return jsonOk({ data })
  }

  if (body.account_status) {
    const admin = await requireFullAdmin()
    if (admin.response) return admin.response
    if (!['active', 'suspended', 'banned'].includes(body.account_status)) return jsonError('Invalid account status.')
    const { data, error } = await auth.supabase.rpc('set_account_status', {
      p_user_id: body.id,
      p_status: body.account_status,
    })
    if (error) {
      const message = error.message || ''
      if (/only admins/i.test(message)) return jsonError('Only admins can change account status.', 403)
      if (/your own/i.test(message)) return jsonError('You cannot change your own account status.', 400)
      if (/not found/i.test(message)) return jsonError('User not found.', 404)
      return dbError(error, 'Unable to update account status.', 400)
    }
    await writeAudit(auth.supabase, { actorId: auth.user.id, action: 'user.status', entityType: 'user', entityId: body.id, metadata: { account_status: body.account_status } })
    await createNotification(auth.supabase, {
      user_id: body.id,
      type: 'account_notice',
      title: 'Your account status changed',
      body: `Your account is now ${body.account_status}.`,
      actor_id: auth.user.id,
      path: '/settings',
      metadata: { account_status: body.account_status },
    }).catch((notificationError) => console.error('[unimart:users:status-notify]', notificationError))
    return jsonOk({ data })
  }

  const updates: Record<string, unknown> = {}
  if (typeof body.verified === 'boolean') updates.verified = body.verified
  if (!Object.keys(updates).length) return jsonError('No updates provided.')
  const { data, error } = await auth.supabase.from('profiles').update(updates).eq('id', body.id).select().single()
  if (error) return dbError(error, 'Unable to update user.', 400)
  await writeAudit(auth.supabase, { actorId: auth.user.id, action: 'user.verify', entityType: 'user', entityId: body.id, metadata: updates })
  if (typeof body.verified === 'boolean') {
    await createNotification(auth.supabase, {
      user_id: body.id,
      type: 'account_notice',
      title: body.verified ? 'Your profile was verified' : 'Your verification badge was removed',
      body: body.verified
        ? 'Your account now shows as verified on UniMart.'
        : 'Your account no longer shows a verified badge.',
      actor_id: auth.user.id,
      path: '/settings',
      metadata: { verified: body.verified },
    }).catch((notificationError) => console.error('[unimart:users:verify-notify]', notificationError))
  }
  return jsonOk({ data })
}
