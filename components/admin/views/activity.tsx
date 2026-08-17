'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, MessageSquare, ScrollText, ShoppingBag, Users } from 'lucide-react'
import { FilterBar, FilterSelect } from '@/components/admin/filter-bar'
import { InsightTile } from '@/components/admin/insight-tile'
import { PageHeader } from '@/components/admin/page-header'
import { useListParams } from '@/components/admin/use-list-params'
import { useAdminResource } from '@/components/admin/use-resource'
import { EmptyState } from '@/components/admin/empty-state'
import { Avatar } from '@/components/market/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { colorFromSeed, formatDate, formatDateTime, timeAgo } from '@/lib/format'
import type { AuditLog, Paginated } from '@/lib/types'

const ENTITY_OPTIONS = [
  { value: 'all', label: 'All entities' },
  { value: 'user', label: 'Users' },
  { value: 'listing', label: 'Listings' },
  { value: 'report', label: 'Reports' },
  { value: 'shop', label: 'Shops' },
  { value: 'article', label: 'Articles' },
  { value: 'conversation', label: 'Messages' },
]

const ACTION_OPTIONS = [
  { value: 'all', label: 'All actions' },
  { value: 'user.role', label: 'Role change' },
  { value: 'user.status', label: 'Account status' },
  { value: 'user.verify', label: 'Verification' },
  { value: 'listing.moderate', label: 'Listing moderate' },
  { value: 'shop.status', label: 'Shop status' },
  { value: 'report.status', label: 'Report status' },
  { value: 'article.create', label: 'Article create' },
  { value: 'article.update', label: 'Article update' },
  { value: 'article.status', label: 'Article status' },
  { value: 'message.view', label: 'Thread view' },
]

const ACTION_LABELS: Record<string, string> = {
  'user.role': 'Changed role',
  'user.status': 'Updated account',
  'user.verify': 'Updated verification',
  'listing.moderate': 'Moderated listing',
  'shop.status': 'Updated shop',
  'report.status': 'Updated report',
  'article.create': 'Created article',
  'article.update': 'Updated article',
  'article.status': 'Updated article status',
  'message.view': 'Viewed thread',
}

const ENTITY_LABELS: Record<string, string> = {
  user: 'User',
  listing: 'Listing',
  report: 'Report',
  shop: 'Shop',
  article: 'Article',
  conversation: 'Thread',
}

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action.replaceAll('.', ' · ').replaceAll('_', ' ')
}

function entityLabel(type: string) {
  return ENTITY_LABELS[type] ?? type
}

function entityHref(row: AuditLog) {
  if (!row.entity_id) return null
  if (row.entity_type === 'user') return adminPaths.user(row.entity_id)
  if (row.entity_type === 'listing') return adminPaths.listing(row.entity_id)
  if (row.entity_type === 'report') return adminPaths.report(row.entity_id)
  if (row.entity_type === 'shop') return adminPaths.shop(row.entity_id)
  if (row.entity_type === 'article') return adminPaths.article(row.entity_id)
  if (row.entity_type === 'conversation') return adminPaths.message(row.entity_id)
  return null
}

function metadataLine(row: AuditLog) {
  const meta = row.metadata ?? {}
  if (typeof meta.role === 'string') return `Role set to ${meta.role}`
  if (typeof meta.account_status === 'string') return `Account ${meta.account_status}`
  if (typeof meta.verified === 'boolean') return meta.verified ? 'Marked verified' : 'Removed verification'
  if (typeof meta.status === 'string') return `Status → ${meta.status}`
  const keys = Object.keys(meta).filter((key) => meta[key] !== undefined && meta[key] !== null && meta[key] !== '')
  if (!keys.length) return null
  return keys.slice(0, 2).map((key) => `${key} ${String(meta[key])}`).join(' · ')
}

function OperatorCell({ row }: { row: AuditLog }) {
  const name = row.actor?.display_name ?? 'System'
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={name} color={colorFromSeed(row.actor_id || row.id)} image={row.actor?.avatar_url} />
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-bold text-[#243e39]">{name}</p>
        <p className="mt-0.5 truncate text-[11px] capitalize text-[#8b9994]">{row.actor?.role ?? 'automated'}</p>
      </div>
    </div>
  )
}

export function ActivityView() {
  const { page, pageSize, q, get, setParams, queryString } = useListParams()
  const entityType = get('entity_type', 'all')
  const action = get('action', 'all')
  const { data, error, loading } = useAdminResource(() => api.adminAudit(queryString), [queryString])
  const result = data as Paginated<AuditLog> | null
  const rows = result?.data ?? []
  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const filtered = Boolean(q || entityType !== 'all' || action !== 'all')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System / Activity"
        title="Audit log"
        description="Append-only record of operator actions across people, listings, reports, shops, articles, and thread views."
      />

      {error ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">{error}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightTile
          label="In this view"
          value={loading ? '—' : total.toLocaleString()}
          hint={filtered ? 'Matching filters' : 'Every audited action'}
          icon={ScrollText}
          active={!filtered}
          onClick={() => setParams({ entity_type: 'all', action: 'all', q: '' })}
        />
        <InsightTile
          label="People"
          value={entityType === 'user' && !loading ? total.toLocaleString() : '—'}
          hint="Roles, status, verify"
          icon={Users}
          accent="green"
          active={entityType === 'user'}
          onClick={() => setParams({ entity_type: entityType === 'user' ? 'all' : 'user' })}
        />
        <InsightTile
          label="Listings"
          value={entityType === 'listing' && !loading ? total.toLocaleString() : '—'}
          hint="Moderation events"
          icon={ShoppingBag}
          accent="amber"
          active={entityType === 'listing'}
          onClick={() => setParams({ entity_type: entityType === 'listing' ? 'all' : 'listing' })}
        />
        <InsightTile
          label="Threads"
          value={entityType === 'conversation' && !loading ? total.toLocaleString() : '—'}
          hint="Safety inbox opens"
          icon={MessageSquare}
          accent="coral"
          active={entityType === 'conversation'}
          onClick={() => setParams({ entity_type: entityType === 'conversation' ? 'all' : 'conversation' })}
        />
      </div>

      <div className="rounded-[24px] border border-[#e5eae7] bg-white p-3 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-4">
        <FilterBar search={q} onSearch={(value) => setParams({ q: value })} searchPlaceholder="Search action, entity, or id">
          <FilterSelect value={entityType} onChange={(value) => setParams({ entity_type: value })} options={ENTITY_OPTIONS} />
          <FilterSelect value={action} onChange={(value) => setParams({ action: value })} options={ACTION_OPTIONS} />
        </FilterBar>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#edf1ef] px-4 py-3.5 sm:px-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Ledger</p>
            <p className="mt-0.5 text-sm font-bold text-[#29463f]">
              {loading ? 'Loading activity…' : `${total.toLocaleString()} ${total === 1 ? 'event' : 'events'}`}
            </p>
          </div>
          <p className="hidden text-[11px] text-[#8b9994] sm:block">Immutable. Newest first.</p>
        </div>

        <div className="relative divide-y divide-[#f0f4f2] md:hidden">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="size-10 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-52" />
                </div>
              </div>
            ))
          ) : rows.map((row) => {
            const href = entityHref(row)
            const body = (
              <div className="flex items-start gap-3">
                <OperatorCell row={row} />
                <div className="ml-auto shrink-0 text-right">
                  <p className="text-[11px] font-semibold text-[#3d5650]">{timeAgo(row.created_at)}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8b9994]">{entityLabel(row.entity_type)}</p>
                </div>
              </div>
            )
            return href ? (
              <Link key={row.id} href={href} className="block px-4 py-3.5 transition hover:bg-[#f8fbf9]">
                {body}
                <p className="mt-2 text-[13px] font-semibold text-[#315e55]">{actionLabel(row.action)}</p>
                {metadataLine(row) ? <p className="mt-0.5 text-[11px] text-[#8b9994]">{metadataLine(row)}</p> : null}
              </Link>
            ) : (
              <div key={row.id} className="px-4 py-3.5">
                {body}
                <p className="mt-2 text-[13px] font-semibold text-[#3d5650]">{actionLabel(row.action)}</p>
              </div>
            )
          })}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-[#edf1ef] bg-[#f8fbf9] text-[10px] uppercase tracking-[0.12em] text-[#8b9994]">
              <tr>
                <th className="px-5 py-3 font-bold">When</th>
                <th className="px-4 py-3 font-bold">Operator</th>
                <th className="px-4 py-3 font-bold">Action</th>
                <th className="px-4 py-3 font-bold">Entity</th>
                <th className="px-5 py-3 font-bold"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#f3f6f4]">
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3.5"><div className="flex items-center gap-3"><Skeleton className="size-10 rounded-full" /><Skeleton className="h-4 w-32" /></div></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-24 rounded-full" /></td>
                    <td className="px-5 py-3.5" />
                  </tr>
                ))
              ) : rows.map((row) => {
                const href = entityHref(row)
                const detail = metadataLine(row)
                const Cell = href
                  ? ({ children, className }: { children: ReactNode; className?: string }) => (
                    <Link href={href} className={`block ${className ?? ''}`}>{children}</Link>
                  )
                  : ({ children, className }: { children: ReactNode; className?: string }) => (
                    <div className={className}>{children}</div>
                  )
                return (
                  <tr key={row.id} className={`border-b border-[#f3f6f4] last:border-0 ${href ? 'group transition hover:bg-[#f8fbf9]' : ''}`}>
                    <td className="px-5 py-3.5">
                      <Cell>
                        <span className="block text-[13px] font-semibold text-[#3d5650]">{formatDate(row.created_at)}</span>
                        <span className="mt-0.5 block text-[11px] text-[#8b9994]">{timeAgo(row.created_at)}</span>
                        <span className="mt-0.5 block text-[10px] text-[#b0bbb6]">{formatDateTime(row.created_at)}</span>
                      </Cell>
                    </td>
                    <td className="px-4 py-3.5">
                      <Cell><OperatorCell row={row} /></Cell>
                    </td>
                    <td className="px-4 py-3.5">
                      <Cell>
                        <span className="block text-[13px] font-bold text-[#243e39]">{actionLabel(row.action)}</span>
                        {detail ? <span className="mt-0.5 block text-[11px] text-[#8b9994]">{detail}</span> : (
                          <span className="mt-0.5 block font-mono text-[10px] text-[#b0bbb6]">{row.action}</span>
                        )}
                      </Cell>
                    </td>
                    <td className="px-4 py-3.5">
                      <Cell>
                        <span className="inline-flex rounded-full bg-[#edf4f0] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#315e55]">
                          {entityLabel(row.entity_type)}
                        </span>
                        {row.entity_id ? (
                          <span className="mt-1.5 block font-mono text-[11px] text-[#8b9994]">{row.entity_id.slice(0, 8)}</span>
                        ) : null}
                      </Cell>
                    </td>
                    <td className="px-5 py-3.5">
                      {href ? (
                        <Link href={href} className="flex size-8 items-center justify-center rounded-full text-[#c3d0cb] transition group-hover:bg-[#eef5f2] group-hover:text-[#315e55]" aria-label={`Open ${entityLabel(row.entity_type)}`}>
                          <ChevronRight size={16} />
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!loading && !rows.length ? (
          <EmptyState
            icon={ScrollText}
            title="No audited actions yet"
            description="Operator work will appear here. If this stays empty, run scripts/009_admin-ops.sql so the audit table exists."
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
