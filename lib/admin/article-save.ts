import { api } from '@/lib/api-client'
import type { Article } from '@/lib/types'

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

type ProgressFn = (progress: number, stage: string) => void

export async function saveArticleFlow({
  mode,
  id,
  article,
  pendingCoverFile,
  targetStatus,
  onProgress,
}: {
  mode: 'new' | 'edit'
  id?: string
  article: Partial<Article>
  pendingCoverFile?: File | null
  targetStatus: 'draft' | 'published' | 'archived'
  onProgress: ProgressFn
}): Promise<Article> {
  onProgress(6, 'Checking your story…')
  const title = article.title?.trim()
  if (!title) throw new Error('Add a title before saving.')
  const slug = article.slug?.trim() ? slugify(article.slug) : slugify(title)

  let coverUrl = article.cover_url ?? null
  if (pendingCoverFile) {
    onProgress(12, 'Uploading cover image…')
    const uploaded = await api.uploadArticleCover(pendingCoverFile, (pct) => {
      onProgress(12 + pct * 0.38, 'Uploading cover image…')
    })
    coverUrl = uploaded.url
  }

  const payload: Record<string, unknown> = {
    title,
    slug,
    excerpt: article.excerpt ?? '',
    body: article.body ?? '',
    type: article.type ?? 'Community',
    cover_url: coverUrl,
    cover_color: article.cover_color ?? '#e4dbee',
    accent_color: article.accent_color ?? '#745a8e',
    status: targetStatus,
  }

  onProgress(58, targetStatus === 'published' ? 'Saving story…' : targetStatus === 'archived' ? 'Archiving…' : 'Saving draft…')

  if (mode === 'new') {
    const created = await api.createArticle(payload)
    onProgress(targetStatus === 'published' ? 88 : 96, targetStatus === 'published' ? 'Publishing to Explore…' : 'Finishing up…')
    if (targetStatus !== 'draft' && created.data.status !== targetStatus) {
      const updated = await api.updateArticle(created.data.id, { status: targetStatus })
      onProgress(100, targetStatus === 'published' ? 'Live on Explore' : 'Archived')
      return updated.data
    }
    onProgress(100, targetStatus === 'published' ? 'Live on Explore' : targetStatus === 'archived' ? 'Archived' : 'Draft saved')
    return created.data
  }

  if (!id) throw new Error('Article not found.')
  const updated = await api.updateArticle(id, payload)
  onProgress(targetStatus === 'published' ? 94 : 100, targetStatus === 'published' ? 'Publishing to Explore…' : targetStatus === 'archived' ? 'Archived' : 'Draft saved')
  if (targetStatus === 'published') onProgress(100, 'Live on Explore')
  return updated.data
}

export async function quickPublishArticle(id: string, onProgress: ProgressFn) {
  onProgress(20, 'Preparing publish…')
  onProgress(55, 'Publishing to Explore…')
  const updated = await api.updateArticle(id, { status: 'published' })
  onProgress(100, 'Live on Explore')
  return updated.data
}

export async function quickArchiveArticle(id: string, onProgress: ProgressFn) {
  onProgress(40, 'Archiving story…')
  const updated = await api.updateArticle(id, { status: 'archived' })
  onProgress(100, 'Archived')
  return updated.data
}
