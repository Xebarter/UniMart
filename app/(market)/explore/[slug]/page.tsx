'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ArticleBody } from '@/components/market/article-body'
import { ArticleCover } from '@/components/market/article-cover'
import { api } from '@/lib/api-client'
import { readTime } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import type { Article } from '@/lib/types'

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    api.article(slug)
      .then((result) => setArticle(result.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Article not found.'))
  }, [slug])

  if (error) {
    return (
      <div className="mx-auto max-w-[720px] px-5 py-16 text-center">
        <p className="text-sm text-[#81908b]">{error}</p>
        <Link href={marketPaths.explore} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#315e55]">
          <ArrowLeft size={14} /> Back to Explore
        </Link>
      </div>
    )
  }

  if (!article) {
    return <div className="px-5 py-20 text-center text-sm text-[#81908b]">Loading story…</div>
  }

  return (
    <article className="mx-auto w-full max-w-[760px] px-4 pb-12 pt-5 sm:px-8 sm:pt-8">
      <Link href={marketPaths.explore} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#638076] hover:text-[#315e55]">
        <ArrowLeft size={14} /> Explore
      </Link>
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">{article.type}</p>
      <h1 className="mt-2 font-display text-[2rem] font-bold leading-tight tracking-[-0.045em] text-[#243e39] sm:text-[2.4rem]">
        {article.title}
      </h1>
      <p className="mt-3 text-[12px] text-[#8b9994]">{readTime(article.body)}</p>
      {article.excerpt ? <p className="mt-4 text-base leading-7 text-[#5f746c]">{article.excerpt}</p> : null}
      <ArticleCover article={article} className="mt-6 aspect-[16/9] w-full rounded-[22px] sm:rounded-[28px]" />
      <ArticleBody body={article.body} className="mt-8 text-[15px] sm:text-base" />
    </article>
  )
}
