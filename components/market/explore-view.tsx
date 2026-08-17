'use client'

import { BookOpen, PenLine } from 'lucide-react'
import { useMarket } from '@/components/market/provider'
import { readTime } from '@/lib/format'

export function ExploreView() {
  const { articles, requestPost } = useMarket()
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 lg:px-10">
      <div className="max-w-xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Explore UniMart</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.05em] text-[#29463f]">Good ideas travel<br /><span className="text-[#d1734b]">fast on campus.</span></h1>
        <p className="mt-4 text-sm leading-6 text-[#71827b]">Stories, guides, and profiles from the people making student life more interesting.</p>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {articles.map((article, index) => (
          <article key={article.id} className={`group overflow-hidden rounded-2xl border border-[#e5eae7] bg-white text-left ${index === 0 ? 'md:col-span-2 md:flex' : ''}`}>
            <div className={`flex items-end p-6 ${index === 0 ? 'h-56 md:h-auto md:w-1/2' : 'h-44'}`} style={{ background: article.cover_color, color: article.accent_color }}>
              <div><BookOpen size={22} /><p className="mt-10 text-[11px] font-bold uppercase tracking-[0.16em]">{article.type}</p></div>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#a0aaa6]">{readTime(article.body)}</p>
              <h2 className="mt-3 max-w-md font-display text-2xl font-bold leading-tight tracking-[-0.035em] text-[#29463f]">{article.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#81908b]">{article.excerpt || article.body}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-7 rounded-2xl bg-[#e8f0ed] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#638076]">From the community</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[#29463f]">Have a story to tell?</h2>
          </div>
          <button type="button" onClick={requestPost} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#315e55] px-4 py-2.5 text-xs font-bold text-white">Share your work <PenLine size={15} /></button>
        </div>
      </div>
    </div>
  )
}
