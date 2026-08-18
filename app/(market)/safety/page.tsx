import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block"><BrandLogo showWordmark size={34} wordmarkClassName="text-xl" /></Link>
      <h1 className="mt-8 font-display text-[2rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.5rem]">Safety tips</h1>
      <p className="mt-4 text-base leading-7 text-[#5f746c]">
        Your safety matters most. Follow these guidelines to keep every transaction smooth and secure.
      </p>
      <div className="mt-8 space-y-5 text-base leading-7 text-[#5f746c]">
        <div className="rounded-[18px] border border-[#e5eae7] bg-white p-5"><strong className="text-[#243e39]">1. Meet in public.</strong> Always meet in a busy, well-lit place. Markets, malls, and other public spots are a better choice than a private home.</div>
        <div className="rounded-[18px] border border-[#e5eae7] bg-white p-5"><strong className="text-[#243e39]">2. Inspect before you pay.</strong> Examine the item in person before handing over money. If something feels off, walk away.</div>
        <div className="rounded-[18px] border border-[#e5eae7] bg-white p-5"><strong className="text-[#243e39]">3. Use in-app payments.</strong> Paying through UniMart&apos;s checkout creates a record and protects both buyer and seller.</div>
        <div className="rounded-[18px] border border-[#e5eae7] bg-white p-5"><strong className="text-[#243e39]">4. Never share personal credentials.</strong> UniMart will never ask for your password, PIN, or OTP. Report any message that does.</div>
        <div className="rounded-[18px] border border-[#e5eae7] bg-white p-5"><strong className="text-[#243e39]">5. Trust verified sellers.</strong> Look for the verification badge. Verified sellers have been reviewed by UniMart.</div>
        <div className="rounded-[18px] border border-[#e5eae7] bg-white p-5"><strong className="text-[#243e39]">6. Report suspicious activity.</strong> If a listing seems fake, a price looks too good to be true, or someone pressures you, use the report button or email <a href="mailto:safety@unimart.app" className="font-bold text-[#315e55]">safety@unimart.app</a>.</div>
      </div>
    </div>
  )
}
