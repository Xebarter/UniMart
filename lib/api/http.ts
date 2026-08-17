import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { isRestrictedStatus, loadAccountStatus, loadOperator } from '@/lib/admin/account'
import { createClient } from '@/lib/supabase/server'
import type { createClient as createServerSupabase } from '@/lib/supabase/server'
import type { AdminOperator } from '@/lib/types'

type Supabase = Awaited<ReturnType<typeof createServerSupabase>>

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function missingSchema(error: { message?: string } | null) {
  const message = error?.message ?? ''
  return /schema cache|does not exist|could not find the table/i.test(message)
}

export function dbError(error: { message?: string; code?: string } | null, fallback: string, status = 500) {
  if (error?.message) console.error('[unimart:db]', error.code, error.message)
  if (missingSchema(error)) {
    return jsonError('Database is not initialized. Run scripts/001_schema.sql in the Supabase SQL editor.', 503)
  }
  return jsonError(fallback, status)
}

export async function requireUser(): Promise<
  | { supabase: Supabase; user: User; response: null }
  | { supabase: Supabase; user: null; response: NextResponse }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, response: jsonError('Authentication required.', 401) }
  return { supabase, user, response: null }
}

export async function requireAdmin() {
  const auth = await requireUser()
  if (auth.response) return { ...auth, admin: false, operator: null as AdminOperator | null }
  const { data: allowed } = await auth.supabase.rpc('is_admin')
  if (!allowed) return { ...auth, admin: false, operator: null as AdminOperator | null, response: jsonError('Admin access required.', 403) }
  const operator = await loadOperator(auth.supabase, auth.user.id, auth.user.email || 'Admin')
  if (isRestrictedStatus(operator.accountStatus)) {
    return { ...auth, admin: false, operator, response: jsonError('This account is restricted.', 403) }
  }
  return { ...auth, admin: true, operator, response: null }
}

export async function requireFullAdmin() {
  const auth = await requireAdmin()
  if (auth.response) return auth
  if (!auth.operator?.canManageRoles) {
    return { ...auth, response: jsonError('Only admins can perform this action.', 403) }
  }
  return auth
}

export async function rejectIfRestricted(supabase: Awaited<ReturnType<typeof createServerSupabase>>, userId: string) {
  const status = await loadAccountStatus(supabase, userId)
  if (!isRestrictedStatus(status)) return null
  return jsonError(
    status === 'banned' ? 'This account has been banned.' : 'This account is suspended.',
    403,
  )
}

export async function parseJson<T = Record<string, unknown>>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

export function publicMediaUrl(storagePath: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return storagePath
  return `${base}/storage/v1/object/public/listing-media/${storagePath}`
}

export function publicAvatarUrl(storagePath: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return storagePath
  return `${base}/storage/v1/object/public/avatars/${storagePath}`
}

export function isUploadedAvatar(url?: string | null) {
  return Boolean(url && url.includes('/storage/v1/object/public/avatars/'))
}

export function authPhotoUrl(user: User) {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  for (const key of ['avatar_url', 'picture', 'photoURL', 'photo_url']) {
    const value = meta[key]
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) return value
  }
  return null
}
