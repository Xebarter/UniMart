'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  Clock3,
  Globe,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Newspaper,
  Phone,
  Shield,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api-client'
import { DEFAULT_CONTACT_PAGE } from '@/lib/contact'
import { marketPaths } from '@/lib/market-paths'
import type { ContactChannel, ContactPageSettings, ContactTopic } from '@/lib/types'

const ICON_MAP = {
  mail: Mail,
  message: MessageCircle,
  map: MapPin,
  phone: Phone,
  globe: Globe,
  shield: Shield,
  newspaper: Newspaper,
}

export function ContactView() {
  const [settings, setSettings] = useState<ContactPageSettings>(DEFAULT_CONTACT_PAGE)
  const [channels, setChannels] = useState<ContactChannel[]>([])
  const [topics, setTopics] = useState<ContactTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    topic_id: '',
    subject: '',
    message: '',
    company_website: '',
  })
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    api.contactPage()
      .then((result) => {
        setSettings(result.settings ?? DEFAULT_CONTACT_PAGE)
        setChannels(result.channels ?? [])
        setTopics(result.topics ?? [])
        if (result.topics?.[0]?.id) {
          setForm((current) => ({ ...current, topic_id: current.topic_id || result.topics[0].id }))
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load this page.'))
      .finally(() => setLoading(false))
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setFormError('')
    try {
      await api.submitContact(form)
      setDone(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to send your message.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <Link href={marketPaths.home} className="inline-block">
        <BrandLogo showWordmark size={34} wordmarkClassName="text-xl" />
      </Link>

      <section className="relative mt-7 overflow-hidden rounded-[28px] bg-[#315e55] px-6 py-8 text-white sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rotate-[-16deg] rounded-[44%] border-[24px] border-[#47766b]/70" />
        <div className="relative z-10 max-w-[720px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c7ddd6]">Contact</p>
          <h1 className="mt-3 font-display text-[2rem] font-bold tracking-[-0.045em] sm:text-[3rem]">
            {settings.headline}
          </h1>
          <p className="mt-4 max-w-[620px] text-base leading-7 text-[#d4e4df]">{settings.intro}</p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-[#e7f3ee]">
            <Clock3 size={13} />
            {settings.response_note}
          </p>
        </div>
      </section>

      {error ? <p className="mt-6 text-sm text-[#9a4f32]">{error}</p> : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(loading ? [] : channels).map((channel) => {
          const Icon = ICON_MAP[channel.icon as keyof typeof ICON_MAP] ?? Mail
          const inner = (
            <>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#edf6f1] text-[#315e55]">
                <Icon size={18} />
              </span>
              <h2 className="mt-4 font-display text-lg font-bold text-[#243e39]">{channel.title}</h2>
              {channel.description ? <p className="mt-1 text-sm leading-6 text-[#748780]">{channel.description}</p> : null}
              {channel.value ? <p className="mt-3 text-sm font-bold text-[#315e55]">{channel.value}</p> : null}
            </>
          )
          const className = 'rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)]'
          if (channel.href) {
            const external = channel.href.startsWith('http')
            return (
              <Link
                key={channel.id}
                href={channel.href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                className={`${className} transition hover:-translate-y-0.5`}
              >
                {inner}
              </Link>
            )
          }
          return <article key={channel.id} className={className}>{inner}</article>
        })}
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-[#e5eae7] bg-white p-6 shadow-[0_12px_40px_rgba(36,62,57,0.05)] sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Write to us</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] text-[#243e39]">Send a message</h2>
          {!settings.accept_inquiries ? (
            <p className="mt-4 text-sm leading-6 text-[#748780]">The form is closed for now. Use one of the channels above.</p>
          ) : done ? (
            <div className="mt-6 rounded-[22px] border border-[#d5e4de] bg-[#f7fbf9] px-5 py-8 text-center">
              <p className="font-display text-lg font-bold text-[#29463f]">Message received</p>
              <p className="mt-2 text-sm leading-6 text-[#748780]">
                Thanks{form.name ? `, ${form.name.split(' ')[0]}` : ''}. We will reply to {form.email}.
              </p>
            </div>
          ) : (
            <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
              <input
                tabIndex={-1}
                autoComplete="off"
                value={form.company_website}
                onChange={(event) => setForm((current) => ({ ...current, company_website: event.target.value }))}
                className="hidden"
                aria-hidden="true"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  <Input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </Field>
                <Field label="Email">
                  <Input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                </Field>
                <Field label="Topic">
                  <select
                    value={form.topic_id}
                    onChange={(event) => setForm((current) => ({ ...current, topic_id: event.target.value }))}
                    className="h-10 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] px-3.5 text-sm font-medium text-[#243e39] outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
                  >
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>{topic.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Subject">
                <Input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />
              </Field>
              <Field label="Message">
                <Textarea
                  required
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                />
              </Field>
              {formError ? <p className="text-sm text-[#9a4f32]">{formError}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-11 items-center rounded-xl bg-[#315e55] px-5 text-sm font-bold text-white hover:bg-[#274c44] disabled:opacity-60"
              >
                {busy ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <article className="rounded-[28px] bg-[#f8eee7] px-6 py-6 sm:px-8 sm:py-7">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-[#fff8f3] text-[#d1734b]">
              <MapPin size={20} />
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-[-0.03em] text-[#5b4337]">{settings.office_label}</h2>
            <p className="mt-3 text-sm leading-7 text-[#8e7162]">{settings.office_address}</p>
            <p className="mt-4 text-sm font-semibold text-[#5b4337]">{settings.hours}</p>
          </article>

          <article className="rounded-[28px] border border-[#e5eae7] bg-white p-6 shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Faster answers</p>
            <h2 className="mt-2 font-display text-xl font-bold text-[#243e39]">Check these first</h2>
            <div className="mt-4 space-y-2">
              <QuickLink href="/help" icon={HelpCircle} label="FAQ" />
              <QuickLink href="/safety" icon={Shield} label="Safety tips" />
              <QuickLink href={marketPaths.messages} icon={MessageCircle} label="Messages" />
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <Label>{label}</Label>
      {children}
    </label>
  )
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: typeof Mail; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border border-[#eef3f0] px-3 py-3 text-sm font-semibold text-[#315e55] transition hover:bg-[#f7fbf9]">
      <span className="flex size-9 items-center justify-center rounded-xl bg-[#edf6f1] text-[#315e55]">
        <Icon size={16} />
      </span>
      {label}
    </Link>
  )
}
