import type { PressFaq, PressHighlight, PressPage } from '@/lib/types'

export const DEFAULT_PRESS_PAGE: PressPage = {
  id: 1,
  eyebrow: 'Press & Media',
  hero_title: 'Stories from the marketplace nearby.',
  hero_subtitle: 'For journalists, partners, and anyone covering campus commerce, community, and the people building UniMart.',
  contact_email: 'press@unimart.app',
  contact_copy: 'For press inquiries, interviews, partnerships, or brand questions, contact our communications team.',
  contact_sla: 'We aim to respond to press requests within 48 hours.',
  boilerplate_title: 'About UniMart',
  boilerplate: 'UniMart is a campus marketplace for students and communities nearby. People buy, sell, offer services, rent items, post gigs, and discover shops in one organized place. Founded in Kampala, Uganda, UniMart is built to make campus commerce simpler, safer, and easier to find.',
  highlights: [
    { title: 'Founded', body: 'Kampala, Uganda' },
    { title: 'Focus', body: 'Campus communities' },
    { title: 'Marketplace', body: 'Products, services, rentals, gigs' },
    { title: 'Audience', body: 'Students, creators, shops' },
  ],
  quote_text: 'Universities are full of skills, businesses, and opportunities that often go undiscovered. UniMart brings these together.',
  quote_attribution: 'UniMart',
  quote_role: 'Communications',
  faqs: [
    { question: 'How fast do you reply to media requests?', answer: 'We aim to respond within 48 hours on weekdays.' },
    { question: 'Can we interview the team?', answer: 'Yes. Share your outlet, deadline, and topic so we can arrange a call or written comments.' },
    { question: 'What is UniMart in one line?', answer: 'A campus marketplace where students and nearby communities buy, sell, hire, rent, and connect.' },
  ],
  media_notes: 'Please include your outlet, deadline, and the angle you are covering. We can arrange interviews, written comments, and background on campus marketplace stories.',
}

export function pressSchemaError(error: { message?: string } | null) {
  const message = error?.message ?? ''
  return /schema cache|does not exist|could not find the table/i.test(message)
}

function asString(value: unknown, fallback = '', max = 2000) {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : fallback
}

export function parseHighlights(value: unknown): PressHighlight[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const title = asString(record.title, '', 80)
      const body = asString(record.body, '', 240)
      if (!title && !body) return null
      return { title, body }
    })
    .filter((item): item is PressHighlight => Boolean(item))
    .slice(0, 8)
}

export function parseFaqs(value: unknown): PressFaq[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const question = asString(record.question, '', 180)
      const answer = asString(record.answer, '', 800)
      if (!question && !answer) return null
      return { question, answer }
    })
    .filter((item): item is PressFaq => Boolean(item))
    .slice(0, 12)
}

export function isValidPressEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function normalizePressPage(row: Partial<PressPage> | Record<string, unknown> | null | undefined): PressPage {
  const source = (row ?? {}) as Record<string, unknown>
  const highlights = parseHighlights(source.highlights)
  const faqs = parseFaqs(source.faqs)
  return {
    id: 1,
    eyebrow: asString(source.eyebrow, DEFAULT_PRESS_PAGE.eyebrow, 80),
    hero_title: asString(source.hero_title, DEFAULT_PRESS_PAGE.hero_title, 160),
    hero_subtitle: asString(source.hero_subtitle, DEFAULT_PRESS_PAGE.hero_subtitle, 400),
    contact_email: asString(source.contact_email, DEFAULT_PRESS_PAGE.contact_email, 160).toLowerCase(),
    contact_copy: asString(source.contact_copy, DEFAULT_PRESS_PAGE.contact_copy, 400),
    contact_sla: asString(source.contact_sla, DEFAULT_PRESS_PAGE.contact_sla, 200),
    boilerplate_title: asString(source.boilerplate_title, DEFAULT_PRESS_PAGE.boilerplate_title, 80),
    boilerplate: asString(source.boilerplate, DEFAULT_PRESS_PAGE.boilerplate, 2000),
    highlights,
    quote_text: asString(source.quote_text, '', 600),
    quote_attribution: asString(source.quote_attribution, '', 80),
    quote_role: asString(source.quote_role, '', 80),
    faqs,
    media_notes: asString(source.media_notes, '', 800),
    updated_at: typeof source.updated_at === 'string' ? source.updated_at : undefined,
  }
}

export function pressPageFromBody(body: Record<string, unknown>, current?: PressPage | null) {
  const base = current ?? DEFAULT_PRESS_PAGE
  const next = {
    ...base,
    ...body,
    highlights: body.highlights !== undefined ? parseHighlights(body.highlights) : base.highlights,
    faqs: body.faqs !== undefined ? parseFaqs(body.faqs) : base.faqs,
  }
  return normalizePressPage(next)
}

export function pressPageWritePayload(page: PressPage) {
  return {
    id: 1,
    eyebrow: page.eyebrow,
    hero_title: page.hero_title,
    hero_subtitle: page.hero_subtitle,
    contact_email: page.contact_email,
    contact_copy: page.contact_copy,
    contact_sla: page.contact_sla,
    boilerplate_title: page.boilerplate_title,
    boilerplate: page.boilerplate,
    highlights: page.highlights,
    quote_text: page.quote_text,
    quote_attribution: page.quote_attribution,
    quote_role: page.quote_role,
    faqs: page.faqs,
    media_notes: page.media_notes,
  }
}

export function heroTitleParts(title: string) {
  const lines = title.split('\n').map((line) => line.trim()).filter(Boolean)
  if (lines.length >= 2) {
    return { lead: lines.slice(0, -1).join(' '), accent: lines[lines.length - 1] }
  }
  return { lead: title.trim(), accent: '' }
}

export function validatePressPage(page: PressPage) {
  if (!page.hero_title.trim()) return 'Hero title is required.'
  if (!page.contact_email.trim()) return 'Press contact email is required.'
  if (!isValidPressEmail(page.contact_email)) return 'Enter a valid press contact email.'
  if (!page.boilerplate.trim()) return 'Company boilerplate is required.'
  return ''
}
