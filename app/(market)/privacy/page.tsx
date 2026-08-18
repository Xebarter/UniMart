import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block"><BrandLogo showWordmark size={34} wordmarkClassName="text-xl" /></Link>
      <h1 className="mt-8 font-display text-[2rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.5rem]">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[#8b9994]">Last updated: August 2026</p>
      <div className="mt-8 space-y-6 text-base leading-7 text-[#5f746c]">
        <p>UniMart Technologies Ltd ("UniMart," "we," "us") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">Information we collect</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-[#243e39]">Account data:</strong> Name, email, university, area, and avatar when you sign up.</li>
          <li><strong className="text-[#243e39]">Listing data:</strong> Titles, descriptions, photos, prices, and locations of items you post.</li>
          <li><strong className="text-[#243e39]">Usage data:</strong> Pages visited, search queries, device type, and IP address.</li>
          <li><strong className="text-[#243e39]">Payment data:</strong> Transaction references and amounts. Card numbers and mobile money PINs are handled entirely by our payment providers and never stored by UniMart.</li>
        </ul>
        <h2 className="font-display text-lg font-bold text-[#29463f]">How we use your data</h2>
        <p>To operate the marketplace, personalize your experience, process payments, enforce our terms, communicate updates, and improve the Platform.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">Data sharing</h2>
        <p>We share data only with payment processors, hosting providers, and when required by law. We never sell your personal data.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">Data retention</h2>
        <p>Account data is retained while your account is active and for a reasonable period after deletion to comply with legal obligations.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">Your rights</h2>
        <p>You may access, correct, export, or delete your personal data at any time from your account settings or by contacting us.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">Security</h2>
        <p>We use encryption in transit, access controls, and regular audits to protect your information. No system is perfectly secure, and we encourage you to use a strong, unique password.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">Changes</h2>
        <p>We may update this policy periodically. Material changes will be communicated via email or an in-app notice.</p>
      </div>
      <p className="mt-10 text-sm text-[#8b9994]">Privacy inquiries: <a href="mailto:privacy@unimart.app" className="font-bold text-[#315e55]">privacy@unimart.app</a>.</p>
    </div>
  )
}
