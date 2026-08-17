import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { createClient as createServerSupabase } from '@/lib/supabase/server'

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
  if (auth.response) return { ...auth, admin: false }
  const { data: allowed } = await auth.supabase.rpc('is_admin')
  if (!allowed) return { ...auth, admin: false, response: jsonError('Admin access required.', 403) }
  return { ...auth, admin: true, response: null }
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
