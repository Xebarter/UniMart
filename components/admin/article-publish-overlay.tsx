'use client'

import Link from 'next/link'
import { CheckCircle2, ExternalLink, Loader2, Sparkles, X } from 'lucide-react'

export function ArticlePublishOverlay({
  open,
  title,
  stage,
  progress,
  error,
  exploreHref,
  onClose,
  onGoToMagazine,
}: {
  open: boolean
  title: string
  stage: string
  progress: number
  error?: string
  exploreHref?: string
  onClose?: () => void
  onGoToMagazine?: () => void
}) {
  if (!open) return null

  const done = progress >= 100 && !error
  const pct = Math.min(100, Math.max(0, Math.round(progress)))

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0c1c19]/45 p-4 backdrop-blur-[6px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-publish-title"
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[#dfe7e3] bg-white shadow-[0_28px_80px_rgba(36,62,57,0.22)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#edf1ef]">
          <div
            className={`h-full transition-all duration-300 ease-out ${done ? 'bg-[#4e9a7a]' : 'bg-gradient-to-r from-[#315e55] via-[#4e786a] to-[#d1734b]'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-[#eef6f3]/80" />

        <div className="relative px-6 pb-6 pt-8 sm:px-7 sm:pb-7">
          {onClose && (error || (done && !exploreHref && !onGoToMagazine)) ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-[#e5eae7] text-[#8b9994] transition hover:bg-[#f7fbf9]"
            >
              <X size={15} />
            </button>
          ) : null}

          <div className="flex items-start gap-4">
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-[16px] ring-1 ${
              error
                ? 'bg-[#fff5f0] text-[#d1734b] ring-[#f5ddd0]'
                : done
                  ? 'bg-[#edf6f1] text-[#3d7a62] ring-[#d4e8e0]'
                  : 'bg-[#eef6f3] text-[#315e55] ring-[#d4e8e0]'
            }`}
            >
              {error ? <X size={22} strokeWidth={2.2} /> : done ? <CheckCircle2 size={22} strokeWidth={2.2} /> : <Loader2 size={22} className="animate-spin" />}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p id="article-publish-title" className="font-display text-lg font-bold tracking-[-0.03em] text-[#243e39]">{title}</p>
              <p className="mt-1 text-sm text-[#748780]">{error ?? stage}</p>
            </div>
            {!error && !done ? (
              <span className="font-display text-2xl font-bold tabular-nums tracking-[-0.04em] text-[#315e55]">{pct}%</span>
            ) : null}
          </div>

          <div className="mt-6">
            <div className="h-2 overflow-hidden rounded-full bg-[#edf1ef]">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  error ? 'bg-[#d1734b]' : done ? 'bg-[#4e9a7a]' : 'bg-gradient-to-r from-[#315e55] to-[#4e786a]'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {!error && !done ? (
              <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-[#8b9994]">
                <Sparkles size={13} className="text-[#d1734b]" />
                Uploading content and syncing to Explore
              </div>
            ) : null}
            {done ? (
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#4e786a]">Ready on campus</p>
            ) : null}
            {done && (exploreHref || onGoToMagazine) ? (
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                {onGoToMagazine ? (
                  <button
                    type="button"
                    onClick={onGoToMagazine}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-[#315e55] px-4 text-xs font-bold text-white transition hover:bg-[#294f48]"
                  >
                    Back to magazine
                  </button>
                ) : null}
                {exploreHref ? (
                  <Link
                    href={exploreHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#dfe7e3] bg-white px-4 text-xs font-bold text-[#638076] transition hover:bg-[#f7fbf9]"
                  >
                    View on Explore
                    <ExternalLink size={13} />
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
