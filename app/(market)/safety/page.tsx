import Link from 'next/link'
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Eye,
  HandCoins,
  KeyRound,
  Shield,
  Siren,
  Store,
  UserRoundCheck,
  WalletCards,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

const QUICK_POINTS = [
  'Verify before you pay',
  'Protect your information',
  'Meet safely',
  'Trust your instincts',
]

const SAFETY_SECTIONS = [
  {
    icon: Shield,
    title: '1. Meet Safely',
    body: 'Meet in public, well-lit places, preferably on or near campus. Avoid meeting alone in isolated locations. Tell a friend where you are going when meeting someone for the first time. For valuable items, consider meeting in a secure location.',
  },
  {
    icon: HandCoins,
    title: '2. Verify Before You Pay',
    body: 'Check the item or service before making payment where possible. Be cautious of prices that seem too good to be true. Never rely solely on screenshots of payment confirmations. Confirm that money has actually been received before handing over an item. Avoid sending money to strangers simply because they pressure you to act quickly.',
  },
  {
    icon: KeyRound,
    title: '3. Protect Your Personal Information',
    body: 'UniMart will never ask you for your password or mobile-money PIN.',
    bullets: [
      'Passwords or verification codes',
      'Bank or mobile-money PINs',
      'National ID details',
      'Private addresses',
      'Sensitive personal documents',
      'Other confidential information',
    ],
  },
  {
    icon: Eye,
    title: '4. Be Careful With Listings',
    body: 'Before buying, renting or hiring, read the complete listing and make sure the details are clear.',
    bullets: [
      'Read the complete listing',
      'Check photos and descriptions carefully',
      'Ask questions about anything unclear',
      'Confirm price, location and availability',
      'Inspect physical items before payment when possible',
    ],
  },
  {
    icon: Store,
    title: '5. Buying & Selling',
    body: 'Sellers should describe products honestly and keep evidence of important transactions. Buyers should verify the seller, inspect the product and avoid unnecessary advance payments. Never allow someone to pressure you into completing a transaction immediately.',
  },
  {
    icon: WalletCards,
    title: '6. Renting Items',
    body: 'Before renting, agree clearly on the important terms and document the condition of valuable items before taking possession.',
    bullets: [
      'Rental price',
      'Duration',
      'Deposit',
      'Condition of the item',
      'Return date',
      'Responsibility for damage or loss',
    ],
  },
  {
    icon: Briefcase,
    title: '7. Gigs & Services',
    body: 'When posting or applying for a gig, clearly agree on the work, payment and deadline. Verify important claims about qualifications or experience. Never pay someone to "unlock" a job opportunity unless you are certain the arrangement is legitimate. Be cautious of requests for sensitive personal information. Report suspicious job offers.',
  },
  {
    icon: AlertTriangle,
    title: '8. Watch for Scams',
    body: 'If something feels wrong, stop and verify before proceeding.',
    bullets: [
      'Urgent pressure to pay',
      'Requests to move immediately to another platform',
      'Fake payment confirmations',
      'Unusually low prices',
      'Requests for passwords, PINs or verification codes',
      'Requests for unnecessary personal documents',
      'Offers that sound unrealistic',
    ],
  },
  {
    icon: UserRoundCheck,
    title: '9. Protect Your Account',
    body: 'Use a strong, unique password. Never share your login credentials. Never share authentication or verification codes. Log out when using a shared computer. Report suspicious account activity immediately.',
  },
  {
    icon: CheckCircle2,
    title: '10. Trust Your Instincts',
    body: 'You are never required to complete a transaction. If a person, listing, gig or interaction makes you uncomfortable, walk away and report it.',
  },
  {
    icon: Siren,
    title: '11. Report Suspicious Activity',
    body: 'If you encounter any of the following, report it to UniMart through the available support channels.',
    bullets: [
      'A scam',
      'Fake listing',
      'Fraudulent account',
      'Harassment',
      'Threats',
      'Suspicious gig',
      'Prohibited goods',
      'Other unsafe behaviour',
    ],
    footer:
      'If you are in immediate danger, contact the appropriate emergency services or authorities.',
  },
]

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block">
        <BrandLogo showWordmark size={34} wordmarkClassName="text-xl" />
      </Link>

      <section className="relative mt-8 overflow-hidden rounded-[32px] border border-[#dfe9e4] bg-[radial-gradient(circle_at_top_left,_rgba(110,164,142,0.18),_transparent_38%),linear-gradient(135deg,#fcfffd_0%,#f3f9f6_46%,#eef6f2_100%)] px-6 py-8 shadow-[0_18px_60px_rgba(36,62,57,0.08)] sm:px-10 sm:py-12">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#dcefe6]/50 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-[#d7e6df] bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#315e55]">
              UniMart Safety Guide
            </span>
            <h1 className="mt-4 font-display text-[2.4rem] font-bold tracking-[-0.05em] text-[#1f3631] sm:text-[3.2rem]">
              Stay smart. Stay alert. Stay safe.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[#5f746c] sm:text-[17px]">
              UniMart connects students and community members to buy, sell, rent,
              offer services, and find gigs. Most interactions are straightforward,
              but it is important to take reasonable precautions when dealing with
              people you do not know.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_POINTS.map((point) => (
              <div
                key={point}
                className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-semibold text-[#29463f] shadow-[0_10px_30px_rgba(36,62,57,0.06)] backdrop-blur"
              >
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        {SAFETY_SECTIONS.map((section) => {
          const Icon = section.icon

          return (
            <article
              key={section.title}
              className="rounded-[26px] border border-[#e3ece8] bg-white p-6 shadow-[0_12px_36px_rgba(36,62,57,0.06)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf6f1] text-[#315e55]">
                  <Icon size={20} />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-bold tracking-[-0.03em] text-[#243e39]">
                    {section.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#667b73]">
                    {section.body}
                  </p>
                </div>
              </div>

              {section.bullets ? (
                <ul className="mt-5 space-y-2 border-t border-[#edf2ef] pt-5 text-sm leading-7 text-[#5f746c]">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3">
                      <span className="mt-2 size-1.5 rounded-full bg-[#6e8f84]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {section.footer ? (
                <p className="mt-5 rounded-2xl bg-[#f7fbf9] px-4 py-4 text-sm leading-7 text-[#5f746c]">
                  {section.footer}
                </p>
              ) : null}
            </article>
          )
        })}
      </div>

      <section className="mt-12 rounded-[28px] border border-[#dfe9e4] bg-[#f7fbf9] px-6 py-8 shadow-[0_10px_30px_rgba(36,62,57,0.04)] sm:px-8">
        <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-[#243e39]">
          Remember
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-8 text-[#5f746c]">
          Verify before you pay. Protect your information. Meet safely. Trust
          your instincts.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#748780]">
          UniMart provides the platform, but users are responsible for making
          informed decisions and taking reasonable precautions when interacting
          with others.
        </p>
      </section>
    </div>
  )
}
