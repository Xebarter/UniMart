import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block"><BrandLogo showWordmark size={34} wordmarkClassName="text-xl" /></Link>
      <h1 className="mt-8 font-display text-[2rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.5rem]">About UniMart</h1>
      <p className="mt-4 text-base leading-7 text-[#5f746c]">
        UniMart started around universities and is open to everyone nearby. Students, creators, shops, and local businesses buy and sell in one place — products, services, rentals, and gigs.
      </p>
      <h2 className="mt-10 font-display text-xl font-bold text-[#29463f]">Our mission</h2>
      <p className="mt-3 text-base leading-7 text-[#5f746c]">
        To make buying and selling nearby simple, safe, and fair. We believe that when people can trade freely, everyone benefits.
      </p>
      <h2 className="mt-10 font-display text-xl font-bold text-[#29463f]">What makes us different</h2>
      <ul className="mt-4 space-y-3 text-base leading-7 text-[#5f746c]">
        <li><strong className="text-[#243e39]">Local-first.</strong> Built for people who deal in person — verified members, neighborhood shops, and safe public handoffs.</li>
        <li><strong className="text-[#243e39]">One account, many places.</strong> Your UniMart profile travels with you. Move, visit, or sell in a new area without starting over.</li>
        <li><strong className="text-[#243e39]">Seller tools.</strong> Open a shop, feature listings, accept mobile money and card payments, and grow your audience with followers and the Explore magazine.</li>
        <li><strong className="text-[#243e39]">Trust &amp; safety.</strong> Verified accounts, moderated listings, community guidelines, and a responsive support team protect every transaction.</li>
      </ul>
      <h2 className="mt-10 font-display text-xl font-bold text-[#29463f]">Where we are</h2>
      <p className="mt-3 text-base leading-7 text-[#5f746c]">
        UniMart started in Kampala, Uganda and now serves people across the continent and beyond. Our team works remotely and in person to keep the platform fast, fair, and reliable.
      </p>
      <p className="mt-8 text-sm text-[#8b9994]">Questions? Reach us at <a href="mailto:hello@unimart.app" className="font-bold text-[#315e55]">hello@unimart.app</a>.</p>
    </div>
  )
}
