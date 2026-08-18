import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

export default function CareersPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block"><BrandLogo showWordmark size={34} wordmarkClassName="text-xl" /></Link>
      <h1 className="mt-8 font-display text-[2rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.5rem]">Careers</h1>
      <p className="mt-4 text-base leading-7 text-[#5f746c]">
        UniMart is building a marketplace for people nearby, starting around universities. We look for people who care about buyers and sellers, ship fast, and think long-term.
      </p>
      <div className="mt-10 rounded-[22px] border border-dashed border-[#d5e4de] bg-[#f7fbf9] px-6 py-10 text-center">
        <h2 className="font-display text-lg font-bold text-[#29463f]">No open roles right now</h2>
        <p className="mt-2 text-sm leading-6 text-[#748780]">We are a small team and hire when the work demands it. Send your CV and a note about what excites you to:</p>
        <a href="mailto:careers@unimart.app" className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#315e55] px-5 text-xs font-bold text-white hover:bg-[#274c44]">careers@unimart.app</a>
      </div>
    </div>
  )
}
