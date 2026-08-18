import Link from 'next/link'
import { BookOpen, CreditCard, MessageCircle, Shield, ShoppingBag, Store, UserCheck } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

const TOPICS = [
  { icon: ShoppingBag, title: 'Buying', body: 'Browse listings, message the seller, agree on a price and meeting spot, then confirm delivery before paying.' },
  { icon: Store, title: 'Selling & shops', body: 'Post a listing with clear photos and a fair price. Open a shop to group your items and build a following.' },
  { icon: CreditCard, title: 'Payments', body: 'Pay with mobile money or card through our secure checkout. Funds are released to the seller once the listing is marked as sold.' },
  { icon: UserCheck, title: 'Verification', body: 'Verified sellers have been reviewed by UniMart. Look for the badge on profiles and shop pages.' },
  { icon: Shield, title: 'Safety', body: 'Always meet in a public place. Inspect items before paying. Report suspicious listings or accounts.' },
  { icon: MessageCircle, title: 'Messaging', body: 'Messages are private between buyer and seller. Keep conversations on the platform so we can help resolve disputes.' },
]

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-[900px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block"><BrandLogo showWordmark size={34} wordmarkClassName="text-xl" /></Link>
      <h1 className="mt-8 font-display text-[2rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.5rem]">Help center</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-[#5f746c]">
        Quick answers to the most common questions about buying, selling, and running a shop on UniMart.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((topic) => {
          const Icon = topic.icon
          return (
            <div key={topic.title} className="rounded-[22px] border border-[#e5eae7] bg-white p-5 shadow-[0_6px_20px_rgba(36,62,57,0.04)]">
              <span className="flex size-10 items-center justify-center rounded-[14px] bg-[#edf6f1] text-[#315e55]"><Icon size={18} /></span>
              <h2 className="mt-4 font-display text-sm font-bold text-[#243e39]">{topic.title}</h2>
              <p className="mt-2 text-[13px] leading-6 text-[#748780]">{topic.body}</p>
            </div>
          )
        })}
      </div>
      <div className="mt-12 rounded-[22px] border border-[#e5eae7] bg-[#f7fbf9] px-6 py-6 text-center">
        <h2 className="font-display text-lg font-bold text-[#29463f]">Still need help?</h2>
        <p className="mt-2 text-sm text-[#748780]">Our support team responds within 24 hours on business days.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <a href="mailto:hello@unimart.app" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#315e55] px-4 text-xs font-bold text-white hover:bg-[#274c44]"><BookOpen size={14} /> Email support</a>
          <Link href="/contact" className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#dfe7e3] bg-white px-4 text-xs font-bold text-[#315e55]">Contact page</Link>
        </div>
      </div>
    </div>
  )
}
