import {
  CONTACT_CHANNEL_ICONS,
  CONTACT_INQUIRY_STATUSES,
  type ContactChannelIcon,
  type ContactInquiryStatus,
  type ContactPageSettings,
} from '@/lib/types'

export const DEFAULT_CONTACT_PAGE: ContactPageSettings = {
  id: 1,
  headline: 'We are here to help.',
  intro: 'Whether you have a question about an account, a listing, safety, press, or anything else — send a note and we will get back to you.',
  response_note: 'We typically reply within one business day.',
  office_label: 'Kampala, Uganda',
  office_address: 'By appointment',
  hours: 'Monday–Friday, 9:00–17:00 EAT',
  accept_inquiries: true,
}

export function contactSchemaError(error: { message?: string } | null) {
  const message = error?.message ?? ''
  return /schema cache|does not exist|could not find the table/i.test(message)
}

export function isContactInquiryStatus(value: unknown): value is ContactInquiryStatus {
  return typeof value === 'string' && (CONTACT_INQUIRY_STATUSES as readonly string[]).includes(value)
}

export function isContactChannelIcon(value: unknown): value is ContactChannelIcon {
  return typeof value === 'string' && (CONTACT_CHANNEL_ICONS as readonly string[]).includes(value)
}

export function contactText(value: unknown, max: number, fallback = '') {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim().slice(0, max)
  return trimmed || fallback
}

export function channelFromBody(body: Record<string, unknown>) {
  return {
    title: contactText(body.title, 80),
    description: contactText(body.description, 240),
    value: contactText(body.value, 160),
    href: contactText(body.href, 400),
    icon: isContactChannelIcon(body.icon) ? body.icon : 'mail',
    sort_order: Number.isFinite(Number(body.sort_order)) ? Math.max(0, Math.round(Number(body.sort_order))) : 0,
    published: typeof body.published === 'boolean' ? body.published : true,
  }
}

export function topicFromBody(body: Record<string, unknown>) {
  return {
    label: contactText(body.label, 80),
    description: contactText(body.description, 240),
    sort_order: Number.isFinite(Number(body.sort_order)) ? Math.max(0, Math.round(Number(body.sort_order))) : 0,
    published: typeof body.published === 'boolean' ? body.published : true,
  }
}
