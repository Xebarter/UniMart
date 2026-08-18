'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  Loader2,
  Lock,
  Mail,
  MailX,
  Megaphone,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Store,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { NewsletterForm } from '@/components/market/newsletter-form'
import { api } from '@/lib/api-client'
import { loginHref } from '@/lib/auth'
import { marketPaths } from '@/lib/market-paths'
import { UNSUBSCRIBE_REASONS, type UnsubscribeReason } from '@/lib/types'

const STOP = [
  { icon: Megaphone, title: 'Deals and campus highlights', body: 'Promotions, featured listings, and seasonal campaigns.' },
  { icon: Sparkles, title: 'Product updates', body: 'New UniMart features and marketplace improvements.' },
  { icon: Store, title: 'Seller tips', body: 'Advice for shops, listings, and growing an audience.' },
  { icon: Newspaper, title: 'Magazine roundups', body: 'Occasional stories from Explore, when we send them by email.' },
]

const KEEP = [
  { icon: Lock, title: 'Account and security', body: 'Sign-in alerts, password changes, and verification.' },
  { icon: CreditCard, title: 'Receipts and orders', body: 'Payment confirmations, boosts, and purchase records.' },
  { icon: ShieldCheck, title: 'Safety and moderation', body: 'Reports you filed, account restrictions, and urgent notices.' },
  { icon: Mail, title: 'Messages you start', body: 'We never email your private chats. Those stay in Messages.' },
]

const FAQS = [
  {
    q: 'Will I still get emails from UniMart?',
    a: 'Yes, when they are required to run your account — for example a receipt, a security alert, or a reply to a report. Marketing and tips stop immediately.',
  },
  {
    q: 'How long does this take?',
    a: 'It is instant. You will not be added to the next send. Emails already in transit may still arrive for a day.',
  },
  {
    q: 'Can I come back later?',
    a: 'Anytime. Use the form on this page, the footer, or Settings → Notifications.',
  },
  {
    q: 'I never signed up. Why am I here?',
    a: 'Someone may have used this address in the footer, or you subscribed from an account that uses this inbox. Unsubscribing still removes it.',
  },
]

type Screen = 'loading' | 'token' | 'account' | 'email' | 'done' | 'idle-account'

export function UnsubscribeView() {
  const searchParams = useSearchParams()
  const token = (searchParams.get('token') ?? '').trim()
  const [screen, setScreen] = useState<Screen>('loading')
  const [email, setEmail] = useState('')
  const [accountEmail, setAccountEmail] = useState('')
  const [inputEmail, setInputEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [reason, setReason] = useState<UnsubscribeReason | ''>('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [already, setAlready] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError('')
      if (token) {
        try {
          const result = await api.unsubscribePreview(token)
          if (cancelled) return
          setEmail(result.email)
          setAlready(result.status === 'unsubscribed')
          setScreen(result.status === 'unsubscribed' ? 'done' : 'token')
        } catch (err) {
          if (cancelled) return
          setError(err instanceof Error ? err.message : 'This unsubscribe link is not valid.')
          setScreen('email')
        }
        return
      }
      try {
        const mine = await api.newsletterMe()
        if (cancelled) return
        setAccountEmail(mine.email ?? '')
        if (!mine.available) {
          setScreen('email')
          return
        }
        if (mine.subscribed) setScreen('account')
        else {
          setAlready(true)
          setEmail(mine.email ? maskLocal(mine.email) : '')
          setScreen('idle-account')
        }
      } catch {
        if (!cancelled) setScreen('email')
      }
    }
    void load()
    return () => { cancelled = true }
  }, [token])

  async function confirmToken() {
    setBusy(true)
    setError('')
    try {
      const result = await api.unsubscribe({ token, reason: reason || undefined })
      setEmail(result.email ?? email)
      setAlready(Boolean(result.already))
      setScreen('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to unsubscribe right now.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmAccount() {
    setBusy(true)
    setError('')
    try {
      await api.updateNewsletterMe({ subscribed: false })
      setEmail(accountEmail ? maskLocal(accountEmail) : email)
      setScreen('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to unsubscribe right now.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmEmail(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await api.unsubscribe({
        email: inputEmail,
        reason: reason || undefined,
        company_website: honeypot,
      })
      setEmail(result.email ?? maskLocal(inputEmail))
      setAlready(Boolean(result.already))
      setScreen('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to unsubscribe right now.')
    } finally {
      setBusy(false)
    }
  }

  const heading =
    screen === 'done'
      ? already
        ? 'This inbox is already off the list.'
        : 'You are unsubscribed.'
      : screen === 'idle-account'
        ? 'You are not on the list.'
        : 'Manage email updates'

  const lede =
    screen === 'done'
      ? 'Marketing, tips, and magazine emails stop for this address. Account, payment, and safety messages may still be sent when needed.'
      : screen === 'idle-account'
        ? 'This UniMart account is not subscribed to deals, features, or seller tips. You can stay off the list or join again below.'
        : 'Leave the newsletter in one step. Transactional mail about your account stays on so the marketplace can still keep you safe.'

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <Link href={marketPaths.home} className="inline-block">
        <BrandLogo showWordmark size={34} wordmarkClassName="text-xl" />
      </Link>

      <section className="relative mt-7 overflow-hidden rounded-[28px] bg-[#315e55] px-6 py-8 text-white sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rotate-[-16deg] rounded-[44%] border-[24px] border-[#47766b]/70" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] bg-gradient-to-l from-[#244840]/35 to-transparent md:block" />
        <div className="relative z-10 max-w-[720px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c7ddd6]">Email preferences</p>
          <h1 className="mt-3 font-display text-[2rem] font-bold tracking-[-0.045em] sm:text-[2.85rem]">{heading}</h1>
          <p className="mt-4 max-w-[620px] text-base leading-7 text-[#d4e4df]">{lede}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-[#e7f3ee]">
              <BadgeCheck size={13} /> Instant · no login required
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-[#e7f3ee]">
              <ShieldCheck size={13} /> Account mail stays protected
            </span>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <section className="rounded-[28px] border border-[#e5eae7] bg-white p-6 shadow-[0_12px_40px_rgba(36,62,57,0.05)] sm:p-8">
          {screen === 'loading' ? (
            <p className="flex items-center gap-2 text-sm text-[#748780]">
              <Loader2 size={16} className="animate-spin" /> Checking your preference…
            </p>
          ) : screen === 'done' ? (
            <DonePanel email={email} already={already} />
          ) : screen === 'idle-account' ? (
            <div>
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#edf6f1] text-[#315e55]">
                <CheckCircle2 size={22} />
              </span>
              <h2 className="mt-4 font-display text-xl font-bold text-[#243e39]">Nothing to turn off</h2>
              {accountEmail ? (
                <p className="mt-2 text-sm leading-6 text-[#5f746c]">
                  Signed in as <span className="font-semibold text-[#243e39]">{accountEmail}</span>.
                </p>
              ) : null}
              <p className="mt-4 text-[13px] font-bold uppercase tracking-[0.12em] text-[#d1734b]">Want updates again?</p>
              <NewsletterForm variant="light" source="settings" />
              <Link href={marketPaths.settings} className="mt-5 inline-flex h-11 items-center rounded-xl border border-[#dfe7e3] px-5 text-sm font-bold text-[#638076] hover:bg-[#f7fbf9]">
                Open settings
              </Link>
            </div>
          ) : screen === 'token' ? (
            <div>
              <h2 className="font-display text-xl font-bold text-[#243e39]">Confirm this inbox</h2>
              <p className="mt-2 text-sm leading-6 text-[#5f746c]">
                Stop UniMart email updates for <span className="font-semibold text-[#243e39]">{email}</span>.
              </p>
              <ReasonField value={reason} onChange={setReason} />
              {error ? <p className="mt-4 text-sm text-[#9a4f32]" role="alert">{error}</p> : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void confirmToken()}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#d1734b] px-5 text-sm font-bold text-white hover:bg-[#b9623e] disabled:opacity-60"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <MailX size={16} />}
                  Unsubscribe
                </button>
                <Link href={marketPaths.home} className="inline-flex h-11 items-center rounded-xl border border-[#dfe7e3] px-5 text-sm font-bold text-[#638076] hover:bg-[#f7fbf9]">
                  Keep updates
                </Link>
              </div>
            </div>
          ) : screen === 'account' ? (
            <div>
              <h2 className="font-display text-xl font-bold text-[#243e39]">Signed-in preference</h2>
              <p className="mt-2 text-sm leading-6 text-[#5f746c]">
                We found a UniMart account on this device
                {accountEmail ? <> for <span className="font-semibold text-[#243e39]">{accountEmail}</span></> : null}.
                Turn off deals, features, and seller tips for that inbox.
              </p>
              {error ? <p className="mt-4 text-sm text-[#9a4f32]" role="alert">{error}</p> : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void confirmAccount()}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#d1734b] px-5 text-sm font-bold text-white hover:bg-[#b9623e] disabled:opacity-60"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <MailX size={16} />}
                  Unsubscribe this account
                </button>
                <Link href={`${marketPaths.settings}#notifications`} className="inline-flex h-11 items-center rounded-xl border border-[#dfe7e3] px-5 text-sm font-bold text-[#638076] hover:bg-[#f7fbf9]">
                  Manage in Settings
                </Link>
              </div>
              <button type="button" onClick={() => setScreen('email')} className="mt-5 text-[12px] font-bold text-[#315e55] hover:underline">
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={(event) => void confirmEmail(event)}>
              <h2 className="font-display text-xl font-bold text-[#243e39]">Unsubscribe by email</h2>
              <p className="mt-2 text-sm leading-6 text-[#5f746c]">
                Enter the address on the UniMart emails. If it is on the list, it will be removed immediately.
              </p>
              {error ? (
                <p className="mt-4 rounded-xl border border-[#f0c7b3] bg-[#fff5f0] px-3.5 py-2.5 text-sm text-[#9a4f32]" role="alert">
                  {error} You can still unsubscribe by typing the inbox below.
                </p>
              ) : null}
              <input
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
                className="hidden"
                aria-hidden="true"
              />
              <label className="mt-5 block text-xs font-bold text-[#526861]">
                Email address
                <span className="relative mt-2 block">
                  <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#93a09c]" />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={inputEmail}
                    onChange={(event) => setInputEmail(event.target.value)}
                    placeholder="you@email.com"
                    className="h-12 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] pl-9 pr-3 text-sm outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
                  />
                </span>
              </label>
              <ReasonField value={reason} onChange={setReason} />
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#d1734b] px-5 text-sm font-bold text-white hover:bg-[#b9623e] disabled:opacity-60"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <MailX size={16} />}
                  Unsubscribe
                </button>
                <a href={loginHref(`${marketPaths.settings}#notifications`)} className="inline-flex h-11 items-center rounded-xl border border-[#dfe7e3] px-5 text-sm font-bold text-[#638076] hover:bg-[#f7fbf9]">
                  Sign in instead
                </a>
              </div>
            </form>
          )}
        </section>

        <aside className="space-y-4">
          <PreferenceCard title="These emails stop" items={STOP} tone="coral" />
          <PreferenceCard title="These still arrive" items={KEEP} tone="green" />
          <div className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Other ways</p>
            <ul className="mt-3 space-y-3 text-[13px] leading-5 text-[#5f746c]">
              <li>
                <Link href={`${marketPaths.settings}#notifications`} className="font-bold text-[#315e55] hover:underline">Settings → Notifications</Link>
                <span className="block text-[#8b9994]">For the email on your UniMart account.</span>
              </li>
              <li>
                <Link href={marketPaths.contact} className="font-bold text-[#315e55] hover:underline">Contact support</Link>
                <span className="block text-[#8b9994]">If a send keeps arriving after you leave the list.</span>
              </li>
              <li>
                <Link href="/privacy" className="font-bold text-[#315e55] hover:underline">Privacy policy</Link>
                <span className="block text-[#8b9994]">How we handle inboxes and marketing consent.</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <section className="mt-8 rounded-[28px] border border-[#e5eae7] bg-white p-6 shadow-[0_12px_40px_rgba(36,62,57,0.04)] sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Questions</p>
        <h2 className="mt-2 font-display text-xl font-bold text-[#243e39]">How unsubscribing works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {FAQS.map((item) => (
            <div key={item.q} className="rounded-[18px] border border-[#edf1ef] bg-[#fafcfb] px-4 py-4">
              <p className="flex items-start gap-2 text-sm font-bold text-[#29463f]">
                <HelpCircle size={15} className="mt-0.5 shrink-0 text-[#d1734b]" />
                {item.q}
              </p>
              <p className="mt-2 text-[13px] leading-6 text-[#748780]">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function DonePanel({ email, already }: { email: string; already: boolean }) {
  return (
    <div>
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#edf6f1] text-[#315e55]">
        <CheckCircle2 size={22} />
      </span>
      <h2 className="mt-4 font-display text-xl font-bold text-[#243e39]">
        {already ? 'Already unsubscribed' : 'Updates stopped'}
      </h2>
      {email ? <p className="mt-2 text-sm text-[#748780]">{email}</p> : null}
      <p className="mt-3 text-sm leading-6 text-[#5f746c]">
        {already
          ? 'This address is not on the UniMart newsletter. You can ignore any leftover mail from a send that had already left our servers.'
          : 'This inbox will not receive the next newsletter. Give existing mail a day to clear.'}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={marketPaths.home} className="inline-flex h-11 items-center rounded-xl bg-[#315e55] px-5 text-sm font-bold text-white hover:bg-[#274c44]">
          Back to UniMart
        </Link>
        <Link href={marketPaths.contact} className="inline-flex h-11 items-center rounded-xl border border-[#dfe7e3] px-5 text-sm font-bold text-[#638076] hover:bg-[#f7fbf9]">
          Contact us
        </Link>
      </div>
      <div className="mt-8 border-t border-[#eef3f0] pt-6">
        <p className="text-[13px] font-bold text-[#243e39]">Changed your mind?</p>
        <p className="mt-1 text-[13px] leading-6 text-[#748780]">Subscribe again with the same inbox. You can leave whenever you want.</p>
        <NewsletterForm variant="light" />
      </div>
    </div>
  )
}

function ReasonField({
  value,
  onChange,
}: {
  value: UnsubscribeReason | ''
  onChange: (value: UnsubscribeReason | '') => void
}) {
  return (
    <label className="mt-5 block text-xs font-bold text-[#526861]">
      Reason <span className="font-medium text-[#8b9994]">(optional)</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as UnsubscribeReason | '')}
        className="mt-2 h-12 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] px-3.5 text-sm font-medium text-[#3d5650] outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
      >
        <option value="">Select a reason</option>
        {UNSUBSCRIBE_REASONS.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
    </label>
  )
}

function PreferenceCard({
  title,
  items,
  tone,
}: {
  title: string
  items: { icon: typeof Mail; title: string; body: string }[]
  tone: 'green' | 'coral'
}) {
  const iconWrap = tone === 'green'
    ? 'bg-[#edf6f1] text-[#315e55]'
    : 'bg-[#fff5f0] text-[#d1734b]'
  return (
    <div className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">{title}</p>
      <ul className="mt-4 space-y-3.5">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.title} className="flex gap-3">
              <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] ${iconWrap}`}>
                <Icon size={14} />
              </span>
              <span>
                <span className="block text-[13px] font-bold text-[#243e39]">{item.title}</span>
                <span className="mt-0.5 block text-[12px] leading-5 text-[#8b9994]">{item.body}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function maskLocal(email: string) {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  return `${local.slice(0, 1)}***@${domain}`
}
