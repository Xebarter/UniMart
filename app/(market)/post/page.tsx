'use client'

import { Suspense, useEffect } from 'react'
import { ShopHub } from '@/components/market/shop-hub'
import { useMarket } from '@/components/market/provider'

export default function ShopPage() {
  const { profile, loading, requestShop } = useMarket()

  useEffect(() => {
    if (loading) return
    if (!profile) requestShop()
  }, [loading, profile, requestShop])

  if (!profile) return null

  return (
    <Suspense>
      <ShopHub />
    </Suspense>
  )
}
