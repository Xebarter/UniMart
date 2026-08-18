import Link from 'next/link'
import {
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  Heart,
  Newspaper,
  Package,
  Sparkles,
  Store,
  Tag,
  Wrench,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

export default function AboutPage() {
  const features = [
    {
      title: 'Buy & sell',
      body: 'Find products from people and shops within your campus community, or list what you want to sell.',
      icon: Package,
    },
    {
      title: 'Services',
      body: 'Offer a skill or find help, from tutoring and design to photography, beauty, and tech services.',
      icon: Wrench,
    },
    {
      title: 'Rentals',
      body: 'Find items you need temporarily or make money by renting out what you own.',
      icon: Building2,
    },
    {
      title: 'Gigs',
      body: 'Discover short-term work opportunities or post a gig when you need a job done.',
      icon: BriefcaseBusiness,
    },
    {
      title: 'Campus shops',
      body: 'Follow shops you like and keep up with the products and services they offer.',
      icon: Store,
    },
    {
      title: 'Saved listings',
      body: 'Keep interesting listings close and come back to them later.',
      icon: Heart,
    },
    {
      title: 'Campus magazine',
      body: 'Read stories, insights, events, and useful content from the university community.',
      icon: Newspaper,
    },
  ]

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <Link href={marketPaths.home} className="inline-block">
        <BrandLogo showWordmark size={34} wordmarkClassName="text-xl" />
      </Link>

      <section className="relative mt-7 overflow-hidden rounded-[28px] bg-[#315e55] px-6 py-8 text-white sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rotate-[-16deg] rounded-[44%] border-[24px] border-[#47766b]/70" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] bg-gradient-to-l from-[#244840]/35 to-transparent md:block" />
        <div className="relative z-10 max-w-[680px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c7ddd6]">About UniMart</p>
          <h1 className="mt-3 font-display text-[2rem] font-bold tracking-[-0.045em] sm:text-[3rem]">
            Built for Campus.
            <br />
            <span className="text-[#f1c6aa]">Powered by Community.</span>
          </h1>
          <p className="mt-4 max-w-[620px] text-base leading-7 text-[#d4e4df]">
            UniMart is a campus marketplace designed to make it easier for students and campus communities to buy, sell, work, offer services, rent things, and discover opportunities, all in one place.
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-[#e5eae7] bg-white px-6 py-6 shadow-[0_12px_40px_rgba(36,62,57,0.05)] sm:px-8 sm:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Why we exist</p>
          <p className="mt-3 text-base leading-7 text-[#5f746c]">
            We believe universities are more than places to study. They are communities full of skills, businesses, ideas, products, and opportunities that often go undiscovered.
          </p>
          <p className="mt-4 text-base leading-7 text-[#5f746c]">UniMart brings these together.</p>
        </div>

        <div className="rounded-[28px] bg-[#f8eee7] px-6 py-6 sm:px-8 sm:py-7">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#fff8f3] text-[#d1734b]">
            <GraduationCap size={20} />
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold tracking-[-0.03em] text-[#5b4337]">Built around campus communities</h2>
          <p className="mt-3 text-sm leading-7 text-[#8e7162]">
            UniMart brings commerce, services, work, and community content into one organized campus marketplace.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <div className="max-w-[760px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">What you can do</p>
          <h2 className="mt-2 font-display text-[1.8rem] font-bold tracking-[-0.04em] text-[#243e39] sm:text-[2.2rem]">One marketplace, many campus needs.</h2>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {features.map(({ title, body, icon: Icon }) => (
            <article key={title} className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_28px_rgba(36,62,57,0.04)]">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#eef4f1] text-[#315e55]">
                <Icon size={18} />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold tracking-[-0.03em] text-[#29463f]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6b7d77]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-[#e5eae7] bg-white px-6 py-6 shadow-[0_12px_40px_rgba(36,62,57,0.05)] sm:px-8 sm:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Campus-first</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] text-[#243e39]">Designed with universities in mind.</h2>
          <p className="mt-3 text-base leading-7 text-[#5f746c]">
            Instead of searching through disconnected social media groups, chats, and pages, UniMart keeps everything in one place.
          </p>
          <p className="mt-4 text-base leading-7 text-[#5f746c]">
            Whether you are selling a laptop, offering design services, looking for a weekend gig, or sharing a story, there is a place for you on UniMart.
          </p>
        </div>

        <div className="rounded-[28px] bg-[#f7fbf9] px-6 py-6 sm:px-8 sm:py-7">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#315e55] shadow-[0_8px_24px_rgba(36,62,57,0.06)]">
            <Sparkles size={20} />
          </span>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Our vision</p>
          <p className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] text-[#243e39]">
            To become the trusted digital marketplace for university communities.
          </p>
          <p className="mt-3 text-sm leading-7 text-[#5f746c]">
            Helping students turn what they have, what they know, and what they can do into opportunities.
          </p>
          <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-[#dce9e4] bg-white px-4 py-3 text-sm font-bold text-[#315e55]">
            <Tag size={15} />
            Buy. Sell. Hire. Rent. Work. Connect.
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-[28px] border border-[#e5eae7] bg-white px-6 py-6 text-center shadow-[0_12px_40px_rgba(36,62,57,0.05)] sm:px-8 sm:py-8">
        <h2 className="font-display text-[1.8rem] font-bold tracking-[-0.04em] text-[#243e39]">Welcome to UniMart.</h2>
        <p className="mt-3 text-sm leading-6 text-[#748780]">
          Questions? Reach us at{' '}
          <a href="mailto:hello@unimart.app" className="font-bold text-[#315e55]">hello@unimart.app</a>.
        </p>
      </section>
    </div>
  )
}
