'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

export function useListParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 25) || 25))
  const q = searchParams.get('q') ?? ''

  const get = useCallback((key: string, fallback = '') => searchParams.get(key) ?? fallback, [searchParams])

  const setParams = useCallback((patch: Record<string, string | number | undefined>, resetPage = true) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === '' || value === 'all') next.delete(key)
      else next.set(key, String(value))
    }
    if (resetPage && patch.page === undefined) next.set('page', '1')
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }, [pathname, router, searchParams])

  const queryString = useMemo(() => searchParams.toString(), [searchParams])

  return { page, pageSize, q, get, setParams, queryString, searchParams }
}
