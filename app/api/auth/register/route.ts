import { createAdminClient } from '@/lib/supabase/admin'
import { jsonError, jsonOk, parseJson } from '@/lib/api/http'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await parseJson<{ email?: string; password?: string }>(request)
  const email = body?.email?.trim().toLowerCase()
  const password = body?.password
  if (!email || !password) return jsonError('Email and password are required.')
  if (password.length < 8) return jsonError('Password must be at least 8 characters.')

  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: email.split('@')[0] },
    })
    if (error) {
      if (/already been registered|already exists/i.test(error.message)) {
        return jsonOk({ created: false })
      }
      if (/password/i.test(error.message)) return jsonError(error.message)
      return jsonError('Unable to create your account.', 400)
    }
    return jsonOk({ created: true })
  } catch {
    return jsonError('Unable to create your account.', 500)
  }
}
