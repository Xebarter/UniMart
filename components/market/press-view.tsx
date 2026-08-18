'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Mail, Quote } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { api } from '@/lib/api-client'
import { marketPaths } from '@/lib/market-paths'
import { DEFAULT_PRESS_PAGE, heroTitleParts } from '@/lib/press'
import type { PressPage } from '@/lib/types'

export function PressView() {
  const [page, setPage] = useState<PressPage>(DEFAULT_PRESS_PAGE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.press()
      .then((result) => setPage(result.data ?? DEFAULT_PRESS_PAGE))
      .catch(() => setPage(DEFAULT_PRESS_PAGE))
      .finally(() => setLoading(false))
  }, [])

  const title = heroTitleParts(page.hero_title || DEFAULT_PRESS_PAGE.hero_title)
  const highlights = page.highlights.filter((item) => item.title || item.body)
  const faqs = page.faqs.filter((item) => item.question || item.answer)
  const email = page.contact_email || DEFAULT_PRESS_PAGE.contact_email
  const boilerplate = page.boilerplate || DEFAULT_PRESS_PAGE.boilerplate

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <Link href={marketPaths.home} className="inline-block">
        <BrandLogo showWordmark size={34} wordmarkClassName="text-xl" />
      </Link>

      <section className="relative mt-7 overflow-hidden rounded-[28px] bg-[#315e55] px-6 py-8 text-white sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rotate-[-16deg] rounded-[44%] border-[24px] border-[#47766b]/70" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] bg-gradient-to-l from-[#244840]/35 to-transparent md:block" />
        <div className="relative z-10 max-w-[720px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c7ddd6]">
            {page.eyebrow || DEFAULT_PRESS_PAGE.eyebrow}
          </p>
          <h1 className="mt-3 font-display text-[2rem] font-bold tracking-[-0.045em] sm:text-[3rem]">
            {title.lead}
            {title.accent ? (
              <>
                <br />
                <span className="text-[#f1c6aa]">{title.accent}</span>
              </>
            ) : null}
          </h1>
          {page.hero_subtitle ? (
            <p className="mt-4 max-w-[620px] text-base leading-7 text-[#d4e4df]">{page.hero_subtitle}</p>
          ) : null}
          <a
            href={`mailto:${email}`}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-xs font-bold text-[#315e55] transition hover:bg-[#f7fbf9]"
          >
            <Mail size={14} />
            {email}
          </a>
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-[#e5eae7] bg-white px-6 py-6 shadow-[0_12px_40px_rgba(36,62,57,0.05)] sm:px-8 sm:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Company</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] text-[#243e39]">
            {page.boilerplate_title || DEFAULT_PRESS_PAGE.boilerplate_title}
          </h2>
          <p className="mt-3 whitespace-pre-line text-base leading-7 text-[#5f746c]">{boilerplate}</p>
        </div>

        <div className="rounded-[28px] bg-[#f8eee7] px-6 py-6 sm:px-8 sm:py-7">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#fff8f3] text-[#d1734b]">
            <Mail size={20} />
          </span>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Media contact</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] text-[#5b4337]">Talk to communications.</h2>
          {page.contact_copy ? <p className="mt-3 text-sm leading-7 text-[#8e7162]">{page.contact_copy}</p> : null}
          {page.contact_sla ? <p className="mt-3 text-sm font-semibold text-[#7a5a4a]">{page.contact_sla}</p> : null}
          <a
            href={`mailto:${email}`}
            className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#315e55] px-5 text-xs font-bold text-white hover:bg-[#274c44]"
          >
            {email}
          </a>
        </div>
      </section>

      {highlights.length ? (
        <section className="mt-10">
          <div className="max-w-[760px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">At a glance</p>
            <h2 className="mt-2 font-display text-[1.8rem] font-bold tracking-[-0.04em] text-[#243e39] sm:text-[2.2rem]">
              Facts for your story.
            </h2>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {highlights.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
                className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_28px_rgba(36,62,57,0.04)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">{item.title}</p>
                <p className="mt-3 font-display text-xl font-bold tracking-[-0.03em] text-[#29463f]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {page.quote_text ? (
        <section className="mt-10 rounded-[28px] bg-[#315e55] px-6 py-8 text-white sm:px-10 sm:py-10">
          <Quote size={22} className="text-[#f1c6aa]" />
          <blockquote className="mt-4 max-w-[760px] font-display text-[1.6rem] font-bold leading-snug tracking-[-0.04em] sm:text-[2rem]">
            {page.quote_text}
          </blockquote>
          {page.quote_attribution || page.quote_role ? (
            <p className="mt-5 text-sm font-semibold text-[#d4e4df]">
              {page.quote_attribution}
              {page.quote_attribution && page.quote_role ? ' · ' : null}
              {page.quote_role}
            </p>
          ) : null}
        </section>
      ) : null}

      {page.media_notes || faqs.length ? (
        <section className="mt-10 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          {page.media_notes ? (
            <div className="rounded-[28px] border border-[#e5eae7] bg-white px-6 py-6 shadow-[0_12px_40px_rgba(36,62,57,0.05)] sm:px-8 sm:py-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Interview guidance</p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] text-[#243e39]">How to request comment.</h2>
              <p className="mt-3 whitespace-pre-line text-base leading-7 text-[#5f746c]">{page.media_notes}</p>
            </div>
          ) : null}
          {faqs.length ? (
            <div className={`rounded-[28px] border border-[#e5eae7] bg-white px-6 py-6 shadow-[0_12px_40px_rgba(36,62,57,0.05)] sm:px-8 sm:py-7 ${page.media_notes ? '' : 'lg:col-span-2'}`}>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Media FAQ</p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] text-[#243e39]">Common press questions.</h2>
              <div className="mt-5 divide-y divide-[#edf1ef]">
                {faqs.map((item, index) => (
                  <article key={`${item.question}-${index}`} className="py-4 first:pt-0 last:pb-0">
                    <h3 className="font-display text-base font-bold text-[#29463f]">{item.question}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#6b7d77]">{item.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {loading ? <span className="sr-only">Loading press page</span> : null}
    </div>
  )
}
