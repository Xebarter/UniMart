export function parseListQuery(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? 25) || 25))
  const q = sanitizeSearch(url.searchParams.get('q'))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { page, pageSize, q, from, to, searchParams: url.searchParams }
}

export function sanitizeSearch(value?: string | null) {
  return (value ?? '').trim().slice(0, 80).replace(/[%,()]/g, '')
}

export function ilikeOr(columns: string[], q: string) {
  return columns.map((column) => `${column}.ilike.%${q}%`).join(',')
}

export function parseRangeDays(value?: string | null) {
  const days = Number(value ?? 30)
  if (days === 7 || days === 30 || days === 90) return days
  return 30
}
