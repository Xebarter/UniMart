import type { ListingCategory } from '@/lib/types'

export const STUDENT_GATED_CATEGORIES = ['Products', 'Services', 'Rentals'] as const
export type StudentGatedCategory = (typeof STUDENT_GATED_CATEGORIES)[number]

export const STUDENT_NUMBER_TAKEN = 'This student number is already in use.'
export const STUDENT_NUMBER_LISTING_REQUIRED =
  'Enter your student number before posting products, services, or rentals.'
export const STUDENT_NUMBER_SHOP_REQUIRED = 'Enter your student number before opening a shop.'
export const STUDENT_NUMBER_GIG_REQUIRED =
  'Enter your student number to apply for gigs, message the poster, or view their phone number.'

const STUDENT_NUMBER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9/\- ]{2,38}[A-Za-z0-9]$/

export function needsStudentNumber(category: string): category is StudentGatedCategory {
  return (STUDENT_GATED_CATEGORIES as readonly string[]).includes(category)
}

export function normalizeStudentNumber(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function hasStudentNumber(value?: string | null) {
  return Boolean(normalizeStudentNumber(value ?? ''))
}

export function validateStudentNumber(value: string) {
  const normalized = normalizeStudentNumber(value)
  if (normalized.length < 4 || normalized.length > 40) {
    return 'Use a student number between 4 and 40 characters.'
  }
  if (!STUDENT_NUMBER_PATTERN.test(normalized)) {
    return 'Use letters, numbers, slashes, or hyphens — the number on your student ID.'
  }
  return ''
}

export function isStudentNumberTakenError(error: { code?: string; message?: string } | null) {
  if (!error) return false
  if (error.code === '23505') return true
  return /student_number/i.test(error.message ?? '') && /duplicate|unique/i.test(error.message ?? '')
}

export function isStudentNumberRequiredError(error: { message?: string } | null) {
  return /student number is required/i.test(error?.message ?? '')
}
