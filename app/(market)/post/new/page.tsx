'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { marketPaths } from '@/lib/market-paths'

export default function NewListingRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace(marketPaths.post)
  }, [router])
  return null
}
