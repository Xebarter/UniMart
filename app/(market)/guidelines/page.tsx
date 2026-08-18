import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block"><BrandLogo showWordmark size={34} wordmarkClassName="text-xl" /></Link>
      <h1 className="mt-8 font-display text-[2rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.5rem]">Community Guidelines</h1>
      <p className="mt-2 text-sm text-[#8b9994]">Last updated: August 2026</p>
      <div className="mt-8 space-y-6 text-base leading-7 text-[#5f746c]">
        <p>UniMart exists to help people buy and sell nearby. These guidelines keep the marketplace safe, welcoming, and useful for everyone.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">Be honest</h2>
        <p>List items accurately. Use real photos, fair prices, and truthful descriptions. Do not misrepresent condition, origin, or availability.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">Be respectful</h2>
        <p>Treat every user with dignity. Harassment, hate speech, discrimination, threats, and doxxing are strictly prohibited.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">No prohibited items</h2>
        <p>Do not list weapons, drugs, stolen goods, counterfeit products, academic fraud services, or anything illegal under local law.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">One identity</h2>
        <p>Use your real name and one account. Impersonation, fake profiles, and ban evasion lead to permanent removal.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">No spam</h2>
        <p>Do not post duplicate listings, unsolicited messages, or misleading content designed to manipulate search results.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">Report violations</h2>
        <p>Use the report button on any listing, message, or profile that breaks these guidelines. Our moderation team reviews every report.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">Enforcement</h2>
        <p>Violations may result in listing removal, account suspension, or a permanent ban depending on severity and history.</p>
      </div>
    </div>
  )
}
