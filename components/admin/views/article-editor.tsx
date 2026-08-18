'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { ArticleBodyEditor } from '@/components/admin/article-body-editor'
import { ArticlePublishOverlay } from '@/components/admin/article-publish-overlay'
import { AdminButton } from '@/components/admin/filter-bar'
import { PageHeader } from '@/components/admin/page-header'
import { saveArticleFlow } from '@/lib/admin/article-save'
import { ArticleCover } from '@/components/market/article-cover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { marketPaths } from '@/lib/market-paths'
import type { Article } from '@/lib/types'

const EMPTY: Partial<Article> = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  type: 'Community',
  cover_url: null,
  cover_color: '#e4dbee',
  accent_color: '#745a8e',
  status: 'draft',
}

export function ArticleEditorView({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<string | null>(null)
  const [article, setArticle] = useState<Partial<Article>>(EMPTY)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [overlay, setOverlay] = useState({
    open: false,
    title: '',
    stage: '',
    progress: 0,
    error: '',
    exploreHref: '' as string | undefined,
    published: false,
    archived: false,
  })

  useEffect(() => {
    if (mode !== 'edit') return
    void api.adminArticle(id).then((result) => setArticle(result.data)).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load article.'))
  }, [id, mode])

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
  }, [])

  function set<K extends keyof Article>(key: K, value: Article[K]) {
    setArticle((current) => ({ ...current, [key]: value }))
  }

  function onCoverSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Use a JPG, PNG, WEBP, or GIF image.')
      return
    }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    const preview = URL.createObjectURL(file)
    previewRef.current = preview
    setCoverPreview(preview)
    setPendingCoverFile(file)
    setError('')
  }

  function removeCover() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = null
    setCoverPreview(null)
    setPendingCoverFile(null)
    set('cover_url', null)
  }

  async function save(targetStatus: 'draft' | 'published' | 'archived') {
    setBusy(true)
    setError('')
    const overlayTitle = targetStatus === 'published' ? 'Publishing article' : targetStatus === 'archived' ? 'Archiving article' : 'Saving draft'
    setOverlay({ open: true, title: overlayTitle, stage: 'Starting…', progress: 0, error: '', exploreHref: undefined, published: false, archived: false })

    try {
      const saved = await saveArticleFlow({
        mode,
        id,
        article,
        pendingCoverFile,
        targetStatus,
        onProgress: (progress, stage) => {
          setOverlay((current) => ({ ...current, progress, stage, error: '' }))
        },
      })

      setArticle(saved)
      if (pendingCoverFile) {
        setPendingCoverFile(null)
        if (previewRef.current) URL.revokeObjectURL(previewRef.current)
        previewRef.current = null
        setCoverPreview(null)
      }

      setOverlay((current) => ({
        ...current,
        progress: 100,
        stage: targetStatus === 'published' ? 'Live on Explore' : targetStatus === 'archived' ? 'Archived' : 'Draft saved',
        exploreHref: targetStatus === 'published' ? marketPaths.article(saved.slug) : undefined,
        published: targetStatus === 'published',
        archived: targetStatus === 'archived',
      }))

      if (targetStatus === 'published' || targetStatus === 'archived') {
        window.setTimeout(() => router.push(adminPaths.articles), 1200)
        return
      }

      if (mode === 'new') {
        window.setTimeout(() => router.replace(adminPaths.article(saved.id)), 700)
        return
      }

      window.setTimeout(() => setOverlay((current) => ({ ...current, open: false })), 900)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save article.'
      setError(message)
      setOverlay((current) => ({ ...current, error: message, stage: 'Something went wrong' }))
    } finally {
      setBusy(false)
    }
  }

  const coverArticle = {
    title: article.title || 'Article cover',
    type: article.type || 'Community',
    cover_url: coverPreview ? null : article.cover_url,
    cover_color: article.cover_color || '#e4dbee',
    accent_color: article.accent_color || '#745a8e',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content / Editor"
        title={mode === 'new' ? 'New article' : article.title || 'Edit article'}
        description="Upload a cover image and write the story. Drafts stay private until you publish them to Explore."
        actions={(
          <div className="flex flex-wrap gap-2">
            <AdminButton onClick={() => void save('draft')} variant="secondary" disabled={busy}>
              {busy ? 'Working…' : 'Save draft'}
            </AdminButton>
            <AdminButton onClick={() => void save('published')} variant="primary" disabled={busy}>
              {busy ? 'Working…' : 'Publish'}
            </AdminButton>
            {mode === 'edit' ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void save('archived')}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#f0c7b3] px-4 text-xs font-bold text-[#c86c48] transition hover:bg-[#fff5f0] disabled:opacity-60"
              >
                Archive
              </button>
            ) : null}
          </div>
        )}
      />

      {error && !overlay.open ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">{error}</div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4 rounded-2xl border border-[#e2e9e5] bg-white p-5">
          <Field label="Title"><Input value={article.title ?? ''} onChange={(event) => set('title', event.target.value)} /></Field>
          <Field label="Slug"><Input value={article.slug ?? ''} onChange={(event) => set('slug', event.target.value)} placeholder="auto-generated from title" /></Field>
          <Field label="Excerpt"><Textarea value={article.excerpt ?? ''} onChange={(event) => set('excerpt', event.target.value)} /></Field>
          <Field label="Body">
            <ArticleBodyEditor value={article.body ?? ''} onChange={(html) => set('body', html)} />
          </Field>
        </div>
        <div className="space-y-4 rounded-2xl border border-[#e2e9e5] bg-white p-5">
          <Field label="Article image">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="relative block w-full overflow-hidden rounded-2xl border border-dashed border-[#d5e4de] bg-[#f7fbf9] text-left transition hover:border-[#8bb4a7] disabled:opacity-60"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="" className="aspect-[16/9] w-full object-cover" />
              ) : article.cover_url ? (
                <ArticleCover article={coverArticle} className="aspect-[16/9] w-full" />
              ) : (
                <span className="flex aspect-[16/9] flex-col items-center justify-center gap-2 text-[#7d9089]">
                  <ImagePlus size={22} />
                  <span className="text-xs font-bold">Upload cover image</span>
                  <span className="px-6 text-center text-[11px] leading-4">Uploaded when you save or publish</span>
                </span>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onCoverSelect(file)
                event.target.value = ''
              }}
            />
            {(coverPreview || article.cover_url) ? (
              <button
                type="button"
                onClick={removeCover}
                disabled={busy}
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#c86c48] hover:underline disabled:opacity-60"
              >
                <Trash2 size={12} />
                Remove image
              </button>
            ) : null}
          </Field>
          <Field label="Type"><Input value={article.type ?? ''} onChange={(event) => set('type', event.target.value)} /></Field>
          <Field label="Fallback cover color"><Input value={article.cover_color ?? ''} onChange={(event) => set('cover_color', event.target.value)} /></Field>
          <Field label="Accent color"><Input value={article.accent_color ?? ''} onChange={(event) => set('accent_color', event.target.value)} /></Field>
          {!coverPreview && !article.cover_url ? (
            <div className="h-24 rounded-2xl" style={{ background: article.cover_color }} />
          ) : null}
          {article.status ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">
              Status · <span className="text-[#315e55]">{article.status}</span>
            </p>
          ) : null}
        </div>
      </div>

      <ArticlePublishOverlay
        open={overlay.open}
        title={overlay.title}
        stage={overlay.stage}
        progress={overlay.progress}
        error={overlay.error || undefined}
        exploreHref={overlay.exploreHref}
        onGoToMagazine={overlay.published || overlay.archived ? () => router.push(adminPaths.articles) : undefined}
        onClose={() => setOverlay((current) => ({ ...current, open: false, error: '' }))}
      />
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
