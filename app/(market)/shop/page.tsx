'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShopHub } from '@/components/market/shop-hub'
import { ShopSetup } from '@/components/market/shop-setup'
import { useMarket } from '@/components/market/provider'
import { marketPaths } from '@/lib/market-paths'

export default function ShopPage() {
  const router = useRouter()
  const { profile, loading, requestShop, myShop, setMyShop } = useMarket()
  const [editingShop, setEditingShop] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!profile) requestShop()
  }, [loading, profile, requestShop])

  if (!profile) return null

  return (
    <div className="mx-auto w-full max-w-[1040px] px-3.5 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-8 lg:px-10">
      {editingShop || !myShop ? (
        <ShopSetup
          shop={myShop}
          embedded
          onSaved={(shop) => {
            setMyShop(shop)
            setEditingShop(false)
          }}
          onCancel={myShop ? () => setEditingShop(false) : undefined}
        />
      ) : (
        <ShopHub shop={myShop} onEditShop={() => setEditingShop(true)} onCompose={() => router.push(marketPaths.postShop)} />
      )}
    </div>
  )
}
