export function getSafeNextPath(value?: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}

export function loginHref(next = '/') {
  return `/auth/login?next=${encodeURIComponent(getSafeNextPath(next))}`
}

export function getAuthCallbackUrl(next = '/') {
  const url = new URL('/auth/callback', window.location.origin)
  url.searchParams.set('next', getSafeNextPath(next))
  return url.toString()
}
