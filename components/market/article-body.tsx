import { articleBodyHtml } from '@/lib/article'

export function ArticleBody({ body, className = '' }: { body: string; className?: string }) {
  const html = articleBodyHtml(body)
  if (!html) return null
  return <div className={`article-body ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
}
