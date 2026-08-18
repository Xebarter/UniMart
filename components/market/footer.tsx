import Link from 'next/link'
import { Globe, Heart, Mail, MapPin, Shield } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

const YEAR = new Date().getFullYear()

const MARKETPLACE = [
  { label: 'Browse listings', href: marketPaths.home },
  { label: 'Saved listings', href: marketPaths.saved },
  { label: 'Explore stories', href: marketPaths.explore },
  { label: 'Open a shop', href: marketPaths.shop },
  { label: 'Post a listing', href: marketPaths.post },
]

const COMPANY = [
  { label: 'About UniMart', href: '/about' },
  { label: 'Careers', href: '/careers' },
  { label: 'Press & media', href: '/press' },
  { label: 'Contact us', href: '/contact' },
]

const SUPPORT = [
  { label: 'FAQ', href: '/help' },
  { label: 'Safety tips', href: '/safety' },
  { label: 'Community guidelines', href: '/guidelines' },
  { label: 'Report an issue', href: '/contact' },
]

const LEGAL = [
  { label: 'Terms of service', href: '/terms' },
  { label: 'Privacy policy', href: '/privacy' },
  { label: 'Cookie policy', href: '/cookies' },
  { label: 'Acceptable use', href: '/acceptable-use' },
]

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c7ddd6]">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link href={link.href} className="text-[13px] leading-5 text-[#9ab5ae] transition hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function MarketFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-gradient-to-b from-[#1a3c36] via-[#142e2a] to-[#0e2420] text-[#c7ddd6]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(209,115,75,0.08),transparent_42%)]" />
      <div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-[44%] border-[28px] border-[#47766b]/15 opacity-60" />

      <div className="relative mx-auto max-w-[1240px] px-5 pb-10 pt-14 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr] lg:gap-8">
          <div className="max-w-xs">
            <Link href={marketPaths.home} className="inline-flex items-center gap-2.5">
              <BrandLogo size={38} />
              <span className="font-display text-[1.5rem] font-bold tracking-[-0.045em] text-white">
                Uni<span className="text-[#f0b696]">Mart</span>
              </span>
            </Link>
            <p className="mt-5 text-[13px] leading-6 text-[#8fb5ab]">
              Buy, sell, and discover nearby — from students and creators to shops and local businesses.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ab5ae]">
                <Globe size={12} /> Local &amp; beyond
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ab5ae]">
                <Shield size={12} /> Verified sellers
              </span>
            </div>
          </div>

          <FooterCol title="Marketplace" links={MARKETPLACE} />
          <FooterCol title="Company" links={COMPANY} />
          <FooterCol title="Support" links={SUPPORT} />
          <FooterCol title="Legal" links={LEGAL} />
        </div>

        <div className="my-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-lg">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Stay in the loop</p>
            <p className="mt-2 text-sm leading-6 text-[#8fb5ab]">
              Get deals, new features, and seller tips delivered to your inbox.
            </p>
            <form
              onSubmit={(event) => event.preventDefault()}
              className="mt-4 flex gap-2"
            >
              <div className="relative min-w-0 flex-1">
                <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6a8f85]" />
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="h-11 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.06] pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#5d847a] focus:border-[#4e786a] focus:ring-2 focus:ring-[#315e55]/50"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-[#d1734b] px-5 text-xs font-bold text-white transition hover:bg-[#b9623e]"
              >
                Subscribe
              </button>
            </form>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-4 sm:justify-end">
              <SocialLink href="https://twitter.com/unimartapp" label="X / Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </SocialLink>
              <SocialLink href="https://instagram.com/unimartapp" label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" /></svg>
              </SocialLink>
              <SocialLink href="https://linkedin.com/company/unimart" label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </SocialLink>
              <SocialLink href="mailto:hello@unimart.app" label="Email">
                <Mail size={16} />
              </SocialLink>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-[#6a8f85] sm:justify-end">
              <MapPin size={11} /> Kampala, Uganda · Serving people nearby
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-[11px] text-[#5d847a] sm:flex-row">
          <p>© {YEAR} UniMart Technologies Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart size={11} className="text-[#d1734b]" /> in Kampala
          </p>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-[#9ab5ae] transition hover:bg-white/10 hover:text-white"
    >
      {children}
    </a>
  )
}
