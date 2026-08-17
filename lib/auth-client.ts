import { createClient } from '@/lib/supabase/client'

export const AUTH_INTENT_KEY = 'unimart_auth_intent'

export async function signInWithEmailPassword(email: string, password: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (!error) return { ok: true as const }
  if (error.message.toLowerCase().includes('confirm')) {
    return { ok: false as const, message: 'Please confirm your email before signing in.' }
  }

  const register = await fetch('/api/auth/register', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const payload = (await register.json().catch(() => ({}))) as { created?: boolean; error?: string }
  if (!register.ok || !payload.created) {
    return {
      ok: false as const,
      message: payload.error && register.status !== 200 ? payload.error : 'Invalid email or password.',
    }
  }

  const { error: retryError } = await supabase.auth.signInWithPassword({ email, password })
  if (retryError) return { ok: false as const, message: 'Unable to sign in. Please try again.' }
  return { ok: true as const }
}
