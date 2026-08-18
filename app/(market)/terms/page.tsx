import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block"><BrandLogo showWordmark size={34} wordmarkClassName="text-xl" /></Link>
      <h1 className="mt-8 font-display text-[2rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.5rem]">Terms of Service</h1>
      <p className="mt-2 text-sm text-[#8b9994]">Last updated: August 2026</p>
      <div className="mt-8 space-y-6 text-base leading-7 text-[#5f746c]">
        <p>By accessing or using UniMart ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">1. Eligibility</h2>
        <p>You must be at least 16 years old to create an account. UniMart started around universities and is open to students, creators, shops, and anyone nearby. We may verify accounts at any time.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">2. Accounts</h2>
        <p>You are responsible for maintaining the security of your account. You may not share credentials, create multiple accounts, or impersonate others. UniMart may suspend or ban accounts that violate these terms.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">3. Marketplace conduct</h2>
        <p>Listings must be accurate and lawful. Prohibited items include illegal goods, weapons, counterfeit products, academic fraud services, and anything that violates local law. UniMart may remove listings and take action against accounts at its discretion.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">4. Payments</h2>
        <p>Payments are processed through third-party providers (mobile money and card gateways). UniMart is not a party to transactions between buyers and sellers. All sales are between the parties involved.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">5. Intellectual property</h2>
        <p>You retain ownership of content you post. By posting, you grant UniMart a worldwide, non-exclusive license to display, distribute, and promote that content on the Platform.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">6. Limitation of liability</h2>
        <p>UniMart provides the Platform "as is." We are not liable for losses arising from transactions, account restrictions, downtime, or third-party actions. Our total liability is limited to the fees you paid to UniMart in the 12 months before the claim.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">7. Changes</h2>
        <p>We may update these terms at any time. Continued use of UniMart after changes constitutes acceptance of the new terms.</p>
        <h2 className="font-display text-lg font-bold text-[#29463f]">8. Governing law</h2>
        <p>These terms are governed by the laws of the Republic of Uganda. Disputes will be resolved in the courts of Kampala, Uganda.</p>
      </div>
      <p className="mt-10 text-sm text-[#8b9994]">Questions about these terms? Email <a href="mailto:legal@unimart.app" className="font-bold text-[#315e55]">legal@unimart.app</a>.</p>
    </div>
  )
}
