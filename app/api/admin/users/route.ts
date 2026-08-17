import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
  if (error) return dbError(error, 'Unable to load users.')
  return jsonOk({ data: data ?? [] })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson<{ id?: string; role?: string; verified?: boolean }>(request)
  if (!body?.id) return jsonError('id is required.')

  if (body.role) {
    if (!['student', 'moderator', 'admin'].includes(body.role)) {
      return jsonError('Invalid role.')
    }
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
    return jsonOk({ data })
  }

  const updates: Record<string, unknown> = {}
  if (typeof body.verified === 'boolean') updates.verified = body.verified
  if (!Object.keys(updates).length) return jsonError('No updates provided.')
  const { data, error } = await auth.supabase.from('profiles').update(updates).eq('id', body.id).select().single()
  if (error) return dbError(error, 'Unable to update user.', 400)
  return jsonOk({ data })
}
