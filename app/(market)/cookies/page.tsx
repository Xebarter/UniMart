import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block"><BrandLogo showWordmark size={34} wordmarkClassName="text-xl" /></Link>
      <h1 className="mt-8 font-display text-[2rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.5rem]">Cookie Policy</h1>
      <p className="mt-2 text-sm text-[#8b9994]">Last updated: August 2026</p>
      <div className="mt-8 space-y-6 text-base leading-7 text-[#5f746c]">
        <p>UniMart uses cookies and similar technologies to keep you signed in, remember your preferences, and understand how the Platform is used.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">Essential cookies</h2>
        <p>Required for authentication, security, and basic functionality. These cannot be disabled while using UniMart.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">Analytics cookies</h2>
        <p>Help us understand traffic patterns and improve the Platform. We use privacy-friendly analytics that do not track you across other sites.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">Managing cookies</h2>
        <p>You can clear or block cookies through your browser settings. Blocking essential cookies may prevent you from signing in or using some features.</p>
      </div>
    </div>
  )
}
