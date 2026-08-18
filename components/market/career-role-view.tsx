'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Briefcase, MapPin, Timer } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { CareerApplyForm } from '@/components/market/career-apply-form'
import { ArticleBody } from '@/components/market/article-body'
import { api } from '@/lib/api-client'
import { DEFAULT_CAREER_PAGE, employmentLabel, workplaceLabel } from '@/lib/careers'
import { marketPaths } from '@/lib/market-paths'
import type { CareerPageSettings, JobRole } from '@/lib/types'

export function CareerRoleView() {
  const { slug } = useParams<{ slug: string }>()
  const [role, setRole] = useState<JobRole | null>(null)
  const [settings, setSettings] = useState<CareerPageSettings>(DEFAULT_CAREER_PAGE)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    api.career(slug)
      .then((result) => {
        setRole(result.data)
        setSettings(result.settings ?? DEFAULT_CAREER_PAGE)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'This role is not available.'))
  }, [slug])

  if (error) {
    return (
      <div className="mx-auto max-w-[720px] px-5 py-16 text-center">
        <p className="text-sm text-[#81908b]">{error}</p>
        <Link href={marketPaths.careers} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#315e55]">
          <ArrowLeft size={14} /> Back to careers
        </Link>
      </div>
    )
  }

  if (!role) {
    return <div className="px-5 py-20 text-center text-sm text-[#81908b]">Loading role…</div>
  }

  const applyEmail = role.apply_email || settings.apply_email

  return (
    <div className="mx-auto max-w-[860px] px-5 py-10 sm:px-8 sm:py-14">
      <Link href={marketPaths.home} className="inline-block">
        <BrandLogo showWordmark size={34} wordmarkClassName="text-xl" />
      </Link>
      <Link href={marketPaths.careers} className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#638076] hover:text-[#315e55]">
        <ArrowLeft size={14} /> All roles
      </Link>

      <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">{role.department}</p>
      <h1 className="mt-2 font-display text-[2rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.6rem]">{role.title}</h1>
      {role.excerpt ? <p className="mt-4 text-base leading-7 text-[#5f746c]">{role.excerpt}</p> : null}

      <div className="mt-5 flex flex-wrap gap-2 text-[12px] font-semibold text-[#638076]">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#edf6f1] px-2.5 py-1">
          <MapPin size={12} /> {role.location}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#edf6f1] px-2.5 py-1">
          <Briefcase size={12} /> {employmentLabel(role.employment_type)} · {workplaceLabel(role.workplace)}
        </span>
        {role.closes_at ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff5f0] px-2.5 py-1 text-[#c86c48]">
            <Timer size={12} /> Apply by {role.closes_at.slice(0, 10)}
          </span>
        ) : null}
      </div>

      {role.description ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-[#243e39]">About the role</h2>
          <ArticleBody body={role.description} className="mt-4 text-[15px] sm:text-base" />
        </section>
      ) : null}
      {role.requirements ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-[#243e39]">What you will bring</h2>
          <ArticleBody body={role.requirements} className="mt-4 text-[15px] sm:text-base" />
        </section>
      ) : null}
      {role.benefits ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-[#243e39]">How we work</h2>
          <ArticleBody body={role.benefits} className="mt-4 text-[15px] sm:text-base" />
        </section>
      ) : null}

      <section id="apply" className="mt-12 rounded-[28px] border border-[#e5eae7] bg-white p-6 shadow-[0_12px_40px_rgba(36,62,57,0.05)] sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Apply</p>
        <h2 className="mt-2 font-display text-[1.5rem] font-bold text-[#243e39]">Apply for {role.title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#5f746c]">
          We read every application. You can also email <a href={`mailto:${applyEmail}`} className="font-bold text-[#315e55]">{applyEmail}</a>.
        </p>
        {role.apply_url ? (
          <a
            href={role.apply_url}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#315e55] px-5 text-sm font-bold text-white hover:bg-[#274c44]"
          >
            Apply on the hiring site
          </a>
        ) : (
          <div className="mt-6">
            <CareerApplyForm roleId={role.id} roleTitle={role.title} />
          </div>
        )}
      </section>
    </div>
  )
}
