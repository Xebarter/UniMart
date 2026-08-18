import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

export default function PressPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block"><BrandLogo showWordmark size={34} wordmarkClassName="text-xl" /></Link>
      <h1 className="mt-8 font-display text-[2rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.5rem]">Press &amp; Media</h1>
      <p className="mt-4 text-base leading-7 text-[#5f746c]">
        For press inquiries, interviews, partnerships, or brand assets, contact our communications team.
      </p>
      <div className="mt-10 rounded-[22px] border border-[#e5eae7] bg-white p-6 shadow-[0_6px_20px_rgba(36,62,57,0.04)]">
        <h2 className="font-display text-base font-bold text-[#243e39]">Media contact</h2>
        <p className="mt-2 text-sm text-[#748780]">We aim to respond to press requests within 48 hours.</p>
        <a href="mailto:press@unimart.app" className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#315e55] px-5 text-xs font-bold text-white hover:bg-[#274c44]">press@unimart.app</a>
      </div>
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold text-[#29463f]">About UniMart</h2>
        <p className="mt-3 text-base leading-7 text-[#5f746c]">
          UniMart is a marketplace for people nearby — students, creators, shops, and local businesses. Founded in Kampala, Uganda, we help people list products, services, rentals, and gigs.
        </p>
      </div>
    </div>
  )
}
