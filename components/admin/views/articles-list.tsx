'use client'

import Link from 'next/link'
import {
  Archive,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ExternalLink,
  FilePenLine,
  Newspaper,
  PenLine,
} from 'lucide-react'
import { AdminButton, FilterBar, FilterSelect } from '@/components/admin/filter-bar'
import { EmptyState } from '@/components/admin/empty-state'
import { InsightTile } from '@/components/admin/insight-tile'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { useListParams } from '@/components/admin/use-list-params'
import { useAdminResource } from '@/components/admin/use-resource'
import { Skeleton } from '@/components/ui/skeleton'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { formatDate, readTime, timeAgo } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import type { Article, Paginated } from '@/lib/types'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

function ArticleCover({ article }: { article: Article }) {
  return (
    <div
      className="flex size-12 shrink-0 items-end overflow-hidden rounded-[14px] border border-[#e5eae7] p-2 shadow-[0_4px_12px_rgba(36,62,57,0.06)]"
      style={{ background: article.cover_color, color: article.accent_color }}
    >
      <BookOpen size={14} strokeWidth={2.25} />
    </div>
  )
}

function ArticleCell({ article }: { article: Article }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ArticleCover article={article} />
      <div className="min-w-0">
        <span className="block truncate font-display text-sm font-bold text-[#243e39]">{article.title}</span>
        <p className="mt-0.5 truncate text-[11px] text-[#8b9994]">/{article.slug}</p>
        {article.excerpt ? (
          <p className="mt-1 line-clamp-1 text-[11px] text-[#748780]">{article.excerpt}</p>
        ) : null}
      </div>
    </div>
  )
}

function TypePill({ article }: { article: Article }) {
  return (
    <span
      className="inline-flex max-w-[140px] truncate rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
      style={{ background: `${article.cover_color}cc`, color: article.accent_color }}
    >
      {article.type}
    </span>
  )
}

export function ArticlesListView() {
  const { page, pageSize, q, get, setParams, queryString } = useListParams()
  const status = get('status', 'all')
  const { data, error, loading } = useAdminResource(() => api.adminArticles(queryString), [queryString])
  const result = data as Paginated<Article> | null
  const rows = result?.data ?? []
  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const filtered = Boolean(q || status !== 'all')
  const insight = filtered ? 'Matching filters' : 'Campus magazine library'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content / Articles"
        title="Magazine"
        description="Draft campus stories, publish to Explore, and archive pieces that are no longer on-brand."
        actions={(
          <>
            <AdminButton href={marketPaths.explore} variant="secondary">
              <ExternalLink size={14} />
              View Explore
            </AdminButton>
            <AdminButton href={adminPaths.articleNew} variant="primary">
              <PenLine size={14} />
              New article
            </AdminButton>
          </>
        )}
      />

      {error ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">{error}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightTile
          label="In this view"
          value={loading ? '—' : total.toLocaleString()}
          hint={insight}
          icon={Newspaper}
          active={!filtered}
          onClick={() => setParams({ status: 'all', q: '' })}
        />
        <InsightTile
          label="Published"
          value={status === 'published' && !loading ? total.toLocaleString() : '—'}
          hint="Live on Explore"
          icon={CircleCheck}
          accent="green"
          active={status === 'published'}
          onClick={() => setParams({ status: status === 'published' ? 'all' : 'published' })}
        />
        <InsightTile
          label="Drafts"
          value={status === 'draft' && !loading ? total.toLocaleString() : '—'}
          hint="Not yet public"
          icon={FilePenLine}
          accent="amber"
          active={status === 'draft'}
          onClick={() => setParams({ status: status === 'draft' ? 'all' : 'draft' })}
        />
        <InsightTile
          label="Archived"
          value={status === 'archived' && !loading ? total.toLocaleString() : '—'}
          hint="Removed from feed"
          icon={Archive}
          accent="slate"
          active={status === 'archived'}
          onClick={() => setParams({ status: status === 'archived' ? 'all' : 'archived' })}
        />
      </div>

      <div className="rounded-[24px] border border-[#e5eae7] bg-white p-3 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-4">
        <FilterBar search={q} onSearch={(value) => setParams({ q: value })} searchPlaceholder="Search title, slug, excerpt, or type">
          <FilterSelect value={status} onChange={(value) => setParams({ status: value })} options={STATUS_OPTIONS} />
        </FilterBar>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#edf1ef] px-4 py-3.5 sm:px-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Editorial</p>
            <p className="mt-0.5 text-sm font-bold text-[#29463f]">
              {loading ? 'Loading articles…' : `${total.toLocaleString()} ${total === 1 ? 'story' : 'stories'}`}
            </p>
          </div>
          <p className="hidden text-[11px] text-[#8b9994] sm:block">Open a row to edit copy, colors, and publish state</p>
        </div>

        <div className="divide-y divide-[#f0f4f2] md:hidden">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="size-12 rounded-[14px]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))
          ) : rows.map((article) => (
            <Link key={article.id} href={adminPaths.article(article.id)} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#f8fbf9]">
              <ArticleCell article={article} />
              <div className="ml-auto flex shrink-0 flex-col items-end gap-1.5">
                <StatusBadge value={article.status} />
                <span className="text-[10px] text-[#8b9994]">{readTime(article.body)}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-[#edf1ef] bg-[#f8fbf9] text-[10px] uppercase tracking-[0.12em] text-[#8b9994]">
              <tr>
                <th className="px-5 py-3 font-bold">Story</th>
                <th className="px-4 py-3 font-bold">Type</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Read time</th>
                <th className="px-4 py-3 font-bold">Published</th>
                <th className="px-5 py-3 font-bold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#f3f6f4]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-12 rounded-[14px]" />
                        <Skeleton className="h-4 w-44" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-3.5" />
                  </tr>
                ))
              ) : rows.map((article) => (
                <tr key={article.id} className="group border-b border-[#f3f6f4] last:border-0 transition hover:bg-[#f8fbf9]">
                  <td className="px-5 py-3.5">
                    <Link href={adminPaths.article(article.id)} className="block">
                      <ArticleCell article={article} />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5"><TypePill article={article} /></td>
                  <td className="px-4 py-3.5"><StatusBadge value={article.status} /></td>
                  <td className="px-4 py-3.5">
                    <span className="text-[13px] font-semibold text-[#5f746c]">{readTime(article.body)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={adminPaths.article(article.id)} className="block">
                      {article.published_at ? (
                        <>
                          <span className="block text-[13px] font-semibold text-[#3d5650]">{formatDate(article.published_at)}</span>
                          <span className="mt-0.5 block text-[11px] text-[#8b9994]">{timeAgo(article.published_at)}</span>
                        </>
                      ) : (
                        <span className="text-[13px] text-[#8b9994]">Not published</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {article.status === 'published' ? (
                        <Link
                          href={marketPaths.explore}
                          target="_blank"
                          rel="noreferrer"
                          className="flex size-8 items-center justify-center rounded-full text-[#c3d0cb] transition hover:bg-[#eef5f2] hover:text-[#315e55]"
                          aria-label={`View ${article.title} on Explore`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <ExternalLink size={14} />
                        </Link>
                      ) : null}
                      <Link
                        href={adminPaths.article(article.id)}
                        className="flex size-8 items-center justify-center rounded-full text-[#c3d0cb] transition group-hover:bg-[#eef5f2] group-hover:text-[#315e55]"
                        aria-label={`Edit ${article.title}`}
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !rows.length ? (
          <EmptyState
            icon={Newspaper}
            title="No articles match these filters"
            description="Try another search term, clear filters, or start a new draft for the campus magazine."
            action={(
              <div className="flex flex-wrap items-center justify-center gap-2">
                <AdminButton onClick={() => setParams({ status: 'all', q: '' })}>
                  Clear filters
                </AdminButton>
                <AdminButton href={adminPaths.articleNew} variant="primary">
                  <PenLine size={14} />
                  New article
                </AdminButton>
              </div>
            )}
          />
        ) : null}

        <div className="flex items-center justify-between border-t border-[#edf1ef] px-4 py-3 text-xs text-[#8b9994] sm:px-5">
          <p>Showing {from}–{to} of {total.toLocaleString()}</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setParams({ page: page - 1 }, false)} className="rounded-lg border border-[#dfe7e3] p-1.5 text-[#526861] transition hover:bg-[#f7fbf9] disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <span className="font-bold text-[#526861]">{page} / {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => setParams({ page: page + 1 }, false)} className="rounded-lg border border-[#dfe7e3] p-1.5 text-[#526861] transition hover:bg-[#f7fbf9] disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
