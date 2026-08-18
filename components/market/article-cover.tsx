import { BookOpen } from 'lucide-react'
import { articleCoverSrc } from '@/lib/article'
import type { Article } from '@/lib/types'

export function ArticleCover({
  article,
  className = '',
  showType = false,
}: {
  article: Pick<Article, 'title' | 'type' | 'cover_url' | 'cover_color' | 'accent_color'>
  className?: string
  showType?: boolean
}) {
  const src = articleCoverSrc(article.cover_url)
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-[#ecefed] ${className}`}>
        <img src={src} alt={article.title} referrerPolicy="no-referrer" className="size-full object-cover object-center" />
        {showType ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#315e55] shadow-[0_4px_12px_rgba(36,62,57,0.12)]">
            {article.type}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <div className={`relative flex items-end overflow-hidden p-3 ${className}`} style={{ background: article.cover_color, color: article.accent_color }}>
      <div>
        <BookOpen size={18} strokeWidth={2.1} />
        {showType ? <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em]">{article.type}</p> : null}
      </div>
    </div>
  )
}
