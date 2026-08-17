'use client'

import { MarketProvider } from '@/components/market/provider'
import { MarketShell } from '@/components/market/shell'

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketProvider>
      <MarketShell>{children}</MarketShell>
    </MarketProvider>
  )
}
