import Link from 'next/link'
import { Mail, MapPin, MessageCircle } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block"><BrandLogo showWordmark size={34} wordmarkClassName="text-xl" /></Link>
      <h1 className="mt-8 font-display text-[2rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.5rem]">Contact us</h1>
      <p className="mt-4 text-base leading-7 text-[#5f746c]">
        We are here to help. Whether you have a question about your account, a listing, a payment, or anything else — reach out and we will get back to you as soon as possible.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        <div className="rounded-[22px] border border-[#e5eae7] bg-white p-5 shadow-[0_6px_20px_rgba(36,62,57,0.04)]">
          <span className="flex size-10 items-center justify-center rounded-[14px] bg-[#edf6f1] text-[#315e55]"><Mail size={18} /></span>
          <h2 className="mt-4 font-display text-sm font-bold text-[#243e39]">Email</h2>
          <p className="mt-1 text-[12px] leading-5 text-[#748780]">General inquiries and support</p>
          <a href="mailto:hello@unimart.app" className="mt-3 block text-sm font-bold text-[#315e55]">hello@unimart.app</a>
        </div>
        <div className="rounded-[22px] border border-[#e5eae7] bg-white p-5 shadow-[0_6px_20px_rgba(36,62,57,0.04)]">
          <span className="flex size-10 items-center justify-center rounded-[14px] bg-[#edf6f1] text-[#315e55]"><MessageCircle size={18} /></span>
          <h2 className="mt-4 font-display text-sm font-bold text-[#243e39]">In-app messaging</h2>
          <p className="mt-1 text-[12px] leading-5 text-[#748780]">Chat with us from your Messages tab</p>
          <Link href={marketPaths.messages} className="mt-3 block text-sm font-bold text-[#315e55]">Open messages</Link>
        </div>
        <div className="rounded-[22px] border border-[#e5eae7] bg-white p-5 shadow-[0_6px_20px_rgba(36,62,57,0.04)]">
          <span className="flex size-10 items-center justify-center rounded-[14px] bg-[#edf6f1] text-[#315e55]"><MapPin size={18} /></span>
          <h2 className="mt-4 font-display text-sm font-bold text-[#243e39]">Office</h2>
          <p className="mt-1 text-[12px] leading-5 text-[#748780]">Kampala, Uganda</p>
          <p className="mt-3 text-sm font-bold text-[#315e55]">By appointment</p>
        </div>
      </div>
      <p className="mt-10 text-sm text-[#8b9994]">For legal matters: <a href="mailto:legal@unimart.app" className="font-bold text-[#315e55]">legal@unimart.app</a>. For press: <a href="mailto:press@unimart.app" className="font-bold text-[#315e55]">press@unimart.app</a>.</p>
    </div>
  )
}
