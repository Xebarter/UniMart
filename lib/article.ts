import { shopCoverSrc } from '@/lib/shop'

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'hr', 'div', 'span',
])

export function articleCoverSrc(value?: string | null) {
  return shopCoverSrc(value)
}

export function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sanitizeHref(value: string) {
  const href = value.trim()
  if (!href || /^(javascript|data|vbscript):/i.test(href)) return ''
  if (/^https?:\/\//i.test(href) || href.startsWith('/') || href.startsWith('mailto:') || href.startsWith('#')) return href
  return ''
}

export function sanitizeArticleHtml(html: string) {
  const withoutDanger = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(?:iframe|object|embed|link|meta|form|input|textarea|button|svg|math)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')

  return withoutDanger.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase()
    const closing = match.startsWith('</')
    if (!ALLOWED_TAGS.has(tag)) return ''
    if (closing) return `</${tag}>`
    if (tag === 'br' || tag === 'hr') return `<${tag}>`
    if (tag !== 'a') return `<${tag}>`
    const hrefMatch = rawAttrs.match(/\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i)
    const href = sanitizeHref(hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? '')
    if (!href) return '<a>'
    const safe = escapeHtml(href)
    const external = /^https?:\/\//i.test(href)
    return external ? `<a href="${safe}" target="_blank" rel="noopener noreferrer">` : `<a href="${safe}">`
  })
}

export function articleBodyHtml(body: string) {
  const trimmed = body.trim()
  if (!trimmed) return ''
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return sanitizeArticleHtml(trimmed)
  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
}
