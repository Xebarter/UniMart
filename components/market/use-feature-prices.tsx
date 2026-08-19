'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { LISTING_CATEGORIES, type FeaturePriceMap, type ListingCategory } from '@/lib/types'

export function useFeaturePrices(enabled = true) {
  const [amounts, setAmounts] = useState<FeaturePriceMap | null>(null)
  const [durationDays, setDurationDays] = useState(7)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    api.featurePrices()
      .then((result) => {
        if (cancelled) return
        setAmounts(result.data)
        setDurationDays(result.duration_days)
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [enabled])

  function amountFor(category: string) {
    if (!amounts) return null
    if (LISTING_CATEGORIES.includes(category as ListingCategory)) return amounts[category as ListingCategory]
    return null
  }

  return { amounts, durationDays, amountFor }
}
