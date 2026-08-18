import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

export default function AcceptableUsePage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block"><BrandLogo showWordmark size={34} wordmarkClassName="text-xl" /></Link>
      <h1 className="mt-8 font-display text-[2rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.5rem]">Acceptable Use Policy</h1>
      <p className="mt-2 text-sm text-[#8b9994]">Last updated: August 2026</p>
      <div className="mt-8 space-y-6 text-base leading-7 text-[#5f746c]">
        <p>This policy supplements the <Link href="/terms" className="font-bold text-[#315e55]">Terms of Service</Link> and <Link href="/guidelines" className="font-bold text-[#315e55]">Community Guidelines</Link>.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">You may not use UniMart to:</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Violate any applicable law or regulation.</li>
          <li>Infringe on the intellectual property rights of others.</li>
          <li>Distribute malware, phishing links, or harmful software.</li>
          <li>Scrape, crawl, or access the Platform through automated means without written permission.</li>
          <li>Interfere with or disrupt the Platform&apos;s infrastructure.</li>
          <li>Attempt to gain unauthorized access to accounts, data, or systems.</li>
          <li>Engage in fraud, money laundering, or any form of financial crime.</li>
        </ul>
        <h2 className="font-display text-lg font-bold text-[#29463f]">Enforcement</h2>
        <p>Violations may result in immediate account termination, content removal, and referral to law enforcement where appropriate.</p>
      </div>
    </div>
  )
}
