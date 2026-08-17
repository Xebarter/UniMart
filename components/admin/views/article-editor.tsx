'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { PageHeader } from '@/components/admin/page-header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import type { Article } from '@/lib/types'

const EMPTY: Partial<Article> = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  type: 'Community',
  cover_color: '#e4dbee',
  accent_color: '#745a8e',
  status: 'draft',
}

export function ArticleEditorView({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [article, setArticle] = useState<Partial<Article>>(EMPTY)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (mode !== 'edit') return
    void api.adminArticle(id).then((result) => setArticle(result.data)).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load article.'))
  }, [id, mode])

  function set<K extends keyof Article>(key: K, value: Article[K]) {
    setArticle((current) => ({ ...current, [key]: value }))
  }

  async function save(publish?: 'draft' | 'published' | 'archived') {
    setBusy(true)
    setError('')
    try {
      const payload = { ...article, status: publish ?? article.status }
      if (mode === 'new') {
        const created = await api.createArticle(payload)
        if (publish && publish !== 'draft') await api.updateArticle(created.data.id, { status: publish })
        router.replace(adminPaths.article(created.data.id))
        return
      }
      await api.updateArticle(id, payload)
      const fresh = await api.adminArticle(id)
      setArticle(fresh.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save article.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content / Editor"
        title={mode === 'new' ? 'New article' : article.title || 'Edit article'}
        description="Stories stay private as drafts until you publish them to Explore."
        actions={(
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void save('draft')} className="rounded-xl border border-[#dfe7e3] bg-white px-3 py-2 text-xs font-bold text-[#638076]">Save draft</button>
            <button type="button" disabled={busy} onClick={() => void save('published')} className="rounded-xl bg-[#315e55] px-3 py-2 text-xs font-bold text-white">Publish</button>
            {mode === 'edit' ? <button type="button" disabled={busy} onClick={() => void save('archived')} className="rounded-xl border border-[#f0c7b3] px-3 py-2 text-xs font-bold text-[#c86c48]">Archive</button> : null}
          </div>
        )}
      />
      {error ? <p className="text-sm text-[#d1734b]">{error}</p> : null}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4 rounded-2xl border border-[#e2e9e5] bg-white p-5">
          <Field label="Title"><Input value={article.title ?? ''} onChange={(event) => set('title', event.target.value)} /></Field>
          <Field label="Slug"><Input value={article.slug ?? ''} onChange={(event) => set('slug', event.target.value)} /></Field>
          <Field label="Excerpt"><Textarea value={article.excerpt ?? ''} onChange={(event) => set('excerpt', event.target.value)} /></Field>
          <Field label="Body"><Textarea className="min-h-64" value={article.body ?? ''} onChange={(event) => set('body', event.target.value)} /></Field>
        </div>
        <div className="space-y-4 rounded-2xl border border-[#e2e9e5] bg-white p-5">
          <Field label="Type"><Input value={article.type ?? ''} onChange={(event) => set('type', event.target.value)} /></Field>
          <Field label="Cover color"><Input value={article.cover_color ?? ''} onChange={(event) => set('cover_color', event.target.value)} /></Field>
          <Field label="Accent color"><Input value={article.accent_color ?? ''} onChange={(event) => set('accent_color', event.target.value)} /></Field>
          <div className="h-24 rounded-2xl" style={{ background: article.cover_color }} />
        </div>
      </div>
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
