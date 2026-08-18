'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Briefcase,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Sparkles,
  Timer,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { CareerApplyForm } from '@/components/market/career-apply-form'
import { api } from '@/lib/api-client'
import { DEFAULT_CAREER_PAGE, employmentLabel, workplaceLabel } from '@/lib/careers'
import { marketPaths } from '@/lib/market-paths'
import type { CareerPageSettings, JobRole } from '@/lib/types'

const VALUES = [
  {
    title: 'Stay close to the work',
    body: 'We talk to buyers and sellers, then ship what actually helps people nearby trade with confidence.',
    icon: HeartHandshake,
  },
  {
    title: 'Move with care',
    body: 'Speed matters, but trust matters more. We would rather get the details right than launch a mess.',
    icon: ShieldCheck,
  },
  {
    title: 'Think in years',
    body: 'UniMart is being built to last. We hire people who can own a problem past the first version.',
    icon: Sparkles,
  },
]

export function CareersView() {
  const [roles, setRoles] = useState<JobRole[]>([])
  const [settings, setSettings] = useState<CareerPageSettings>(DEFAULT_CAREER_PAGE)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.careers()
      .then((result) => {
        setRoles(result.data)
        setSettings(result.settings ?? DEFAULT_CAREER_PAGE)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load roles.'))
      .finally(() => setLoading(false))
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, JobRole[]>()
    for (const role of roles) {
      const key = role.department || 'General'
      const list = map.get(key) ?? []
      list.push(role)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [roles])

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <Link href={marketPaths.home} className="inline-block">
        <BrandLogo showWordmark size={34} wordmarkClassName="text-xl" />
      </Link>

      <section className="relative mt-7 overflow-hidden rounded-[28px] bg-[#315e55] px-6 py-8 text-white sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rotate-[-16deg] rounded-[44%] border-[24px] border-[#47766b]/70" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] bg-gradient-to-l from-[#244840]/35 to-transparent md:block" />
        <div className="relative z-10 max-w-[720px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c7ddd6]">Careers</p>
          <h1 className="mt-3 font-display text-[2rem] font-bold tracking-[-0.045em] sm:text-[3rem]">
            {settings.headline}
          </h1>
          <p className="mt-4 max-w-[620px] text-base leading-7 text-[#d4e4df]">{settings.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#open-roles" className="inline-flex h-11 items-center rounded-xl bg-white px-5 text-sm font-bold text-[#315e55] hover:bg-[#f3f8f6]">
              See open roles
            </a>
            <a href={`mailto:${settings.apply_email}`} className="inline-flex h-11 items-center rounded-xl border border-white/25 px-5 text-sm font-bold text-white hover:bg-white/10">
              {settings.apply_email}
            </a>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {VALUES.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
              <span className="flex size-10 items-center justify-center rounded-[14px] bg-[#edf6f1] text-[#315e55]">
                <Icon size={18} />
              </span>
              <h2 className="mt-4 font-display text-base font-bold text-[#243e39]">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#5f746c]">{item.body}</p>
            </div>
          )
        })}
      </section>

      <section id="open-roles" className="mt-10 scroll-mt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Open roles</p>
            <h2 className="mt-1 font-display text-[1.65rem] font-bold tracking-[-0.04em] text-[#243e39]">Join the team</h2>
          </div>
          <p className="text-sm text-[#8b9994]">
            {loading ? 'Loading…' : `${roles.length} ${roles.length === 1 ? 'opening' : 'openings'}`}
          </p>
        </div>

        {error ? (
          <p className="mt-6 text-sm text-[#9a4f32]">{error}</p>
        ) : loading ? (
          <div className="mt-6 rounded-[24px] border border-[#e5eae7] bg-white px-6 py-10 text-sm text-[#8b9994]">Loading roles…</div>
        ) : !roles.length ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-[#d5e4de] bg-[#f7fbf9] px-6 py-10 text-center">
            <h3 className="font-display text-lg font-bold text-[#29463f]">No open roles right now</h3>
            <p className="mt-2 text-sm leading-6 text-[#748780]">
              We are a small team and hire when the work demands it.
              {settings.accept_general ? ' You can still send a general application below.' : ` Send a note to ${settings.apply_email}.`}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {grouped.map(([department, items]) => (
              <div key={department}>
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b9994]">{department}</h3>
                <div className="space-y-3">
                  {items.map((role) => (
                    <Link
                      key={role.id}
                      href={marketPaths.career(role.slug)}
                      className="group flex flex-col gap-3 rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_8px_24px_rgba(36,62,57,0.04)] transition hover:-translate-y-0.5 hover:border-[#8bb4a7] hover:shadow-[0_16px_40px_rgba(36,62,57,0.08)] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {role.featured ? (
                            <span className="rounded-full bg-[#fff5f0] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#d1734b]">Featured</span>
                          ) : null}
                          <h4 className="font-display text-lg font-bold text-[#243e39]">{role.title}</h4>
                        </div>
                        {role.excerpt ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f746c]">{role.excerpt}</p> : null}
                        <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-semibold text-[#638076]">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#edf6f1] px-2.5 py-1">
                            <MapPin size={12} /> {role.location}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#edf6f1] px-2.5 py-1">
                            <Briefcase size={12} /> {employmentLabel(role.employment_type)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#edf6f1] px-2.5 py-1">
                            {workplaceLabel(role.workplace)}
                          </span>
                          {role.closes_at ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff5f0] px-2.5 py-1 text-[#c86c48]">
                              <Timer size={12} /> Apply by {role.closes_at.slice(0, 10)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#315e55]">
                        View role <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {settings.accept_general ? (
        <section id="apply" className="mt-12 scroll-mt-8 rounded-[28px] border border-[#e5eae7] bg-white p-6 shadow-[0_12px_40px_rgba(36,62,57,0.05)] sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">General applications</p>
          <h2 className="mt-2 font-display text-[1.5rem] font-bold text-[#243e39]">Do not see a fit?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f746c]">
            Tell us what you want to work on. We keep strong people in mind for the next opening, and sometimes we create the role.
          </p>
          <div className="mt-6">
            <CareerApplyForm />
          </div>
        </section>
      ) : null}
    </div>
  )
}
