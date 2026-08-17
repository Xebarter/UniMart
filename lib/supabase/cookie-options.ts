/** Shared cookie settings so the session survives browser restarts until Sign out. */
export function getAuthCookieOptions() {
  return {
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 400 * 24 * 60 * 60,
  }
}

export const browserAuthOptions = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
} as const
