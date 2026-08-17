'use client'

import Link from 'next/link'
import { Banknote, ChevronLeft, ChevronRight, CircleAlert, Clock3, CreditCard, Download, Receipt, Smartphone } from 'lucide-react'
import { AdminButton, FilterBar, FilterSelect } from '@/components/admin/filter-bar'
import { InsightTile } from '@/components/admin/insight-tile'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { useListParams } from '@/components/admin/use-list-params'
import { useAdminResource } from '@/components/admin/use-resource'
import { EmptyState } from '@/components/admin/empty-state'
import { Avatar } from '@/components/market/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { colorFromSeed, formatDate, formatUGX, timeAgo } from '@/lib/format'
import type { Paginated, Payment } from '@/lib/types'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
]

const PROVIDER_OPTIONS = [
  { value: 'all', label: 'All providers' },
  { value: 'paytota', label: 'Paytota' },
  { value: 'dpo', label: 'DPO' },
]

const PURPOSE_OPTIONS = [
  { value: 'all', label: 'All purposes' },
  { value: 'listing_feature', label: 'Listing feature' },
  { value: 'listing_purchase', label: 'Listing purchase' },
]

function purposeLabel(purpose: string) {
  if (purpose === 'listing_feature') return 'Feature boost'
  if (purpose === 'listing_purchase') return 'Listing purchase'
  return purpose.replaceAll('_', ' ')
}

function providerMeta(provider: Payment['provider']) {
  if (provider === 'dpo') return { name: 'DPO', method: 'Card', icon: CreditCard }
  return { name: 'Paytota', method: 'Mobile money', icon: Smartphone }
}

function referenceOf(payment: Payment) {
  return payment.provider_reference || payment.provider_payment_id || payment.id.slice(0, 8)
}

function CustomerCell({ payment }: { payment: Payment }) {
  const name = payment.profiles?.display_name ?? 'Customer'
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={name} color={colorFromSeed(payment.user_id)} image={payment.profiles?.avatar_url} />
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-bold text-[#243e39]">{name}</p>
        <p className="mt-0.5 truncate text-[11px] text-[#8b9994]">{payment.listings?.title || purposeLabel(payment.purpose)}</p>
      </div>
    </div>
  )
}

export function PaymentsListView() {
  const { page, pageSize, q, get, setParams, queryString } = useListParams()
  const status = get('status', 'all')
  const provider = get('provider', 'all')
  const purpose = get('purpose', 'all')
  const { data, error, loading } = useAdminResource(() => api.adminPayments(queryString), [queryString])
  const result = data as Paginated<Payment> | null
  const rows = result?.data ?? []
  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const filtered = Boolean(q || status !== 'all' || provider !== 'all' || purpose !== 'all')
  const pageVolume = rows.filter((row) => row.status === 'paid').reduce((sum, row) => sum + Number(row.amount || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commerce / Payments"
        title="Transactions"
        description="Paytota mobile money and DPO card volume across feature boosts and listing purchases."
        actions={(
          <AdminButton href="/api/admin/export?type=payments">
            <Download size={14} />
            Export CSV
          </AdminButton>
        )}
      />

      {error ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">{error}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightTile
          label="In this view"
          value={loading ? '—' : total.toLocaleString()}
          hint={filtered ? 'Matching filters' : 'Every checkout'}
          icon={Receipt}
          active={!filtered}
          onClick={() => setParams({ status: 'all', provider: 'all', purpose: 'all', q: '' })}
        />
        <InsightTile
          label="Paid"
          value={status === 'paid' && !loading ? total.toLocaleString() : loading ? '—' : formatUGX(pageVolume)}
          hint={status === 'paid' ? 'Settled checkouts' : 'Settled on this page'}
          icon={Banknote}
          accent="green"
          active={status === 'paid'}
          onClick={() => setParams({ status: status === 'paid' ? 'all' : 'paid' })}
        />
        <InsightTile
          label="Pending"
          value={status === 'pending' && !loading ? total.toLocaleString() : '—'}
          hint="Awaiting confirmation"
          icon={Clock3}
          accent="amber"
          active={status === 'pending'}
          onClick={() => setParams({ status: status === 'pending' ? 'all' : 'pending' })}
        />
        <InsightTile
          label="Failed"
          value={status === 'failed' && !loading ? total.toLocaleString() : '—'}
          hint="Did not complete"
          icon={CircleAlert}
          accent="coral"
          active={status === 'failed'}
          onClick={() => setParams({ status: status === 'failed' ? 'all' : 'failed' })}
        />
      </div>

      <div className="rounded-[24px] border border-[#e5eae7] bg-white p-3 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-4">
        <FilterBar search={q} onSearch={(value) => setParams({ q: value })} searchPlaceholder="Search payment id or provider reference">
          <FilterSelect value={status} onChange={(value) => setParams({ status: value })} options={STATUS_OPTIONS} />
          <FilterSelect value={provider} onChange={(value) => setParams({ provider: value })} options={PROVIDER_OPTIONS} />
          <FilterSelect value={purpose} onChange={(value) => setParams({ purpose: value })} options={PURPOSE_OPTIONS} />
        </FilterBar>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_10px_32px_rgba(36,62,57,0.04)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#edf1ef] px-4 py-3.5 sm:px-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Ledger</p>
            <p className="mt-0.5 text-sm font-bold text-[#29463f]">
              {loading ? 'Loading transactions…' : `${total.toLocaleString()} ${total === 1 ? 'payment' : 'payments'}`}
            </p>
          </div>
          <p className="hidden text-[11px] text-[#8b9994] sm:block">Open a row for provider references and payload</p>
        </div>

        <div className="divide-y divide-[#f0f4f2] md:hidden">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="size-10 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            ))
          ) : rows.map((payment) => (
            <Link key={payment.id} href={adminPaths.payment(payment.id)} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#f8fbf9]">
              <CustomerCell payment={payment} />
              <div className="ml-auto flex shrink-0 flex-col items-end gap-1.5">
                <span className="text-sm font-bold text-[#d1734b]">{formatUGX(payment.amount, payment.currency)}</span>
                <StatusBadge value={payment.status} />
              </div>
            </Link>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-[#edf1ef] bg-[#f8fbf9] text-[10px] uppercase tracking-[0.12em] text-[#8b9994]">
              <tr>
                <th className="px-5 py-3 font-bold">Amount</th>
                <th className="px-4 py-3 font-bold">Customer</th>
                <th className="px-4 py-3 font-bold">Purpose</th>
                <th className="px-4 py-3 font-bold">Rail</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Created</th>
                <th className="px-5 py-3 font-bold"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#f3f6f4]">
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3.5"><div className="flex items-center gap-3"><Skeleton className="size-10 rounded-full" /><Skeleton className="h-4 w-32" /></div></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-24 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-3.5" />
                  </tr>
                ))
              ) : rows.map((payment) => {
                const rail = providerMeta(payment.provider)
                const RailIcon = rail.icon
                return (
                  <tr key={payment.id} className="group border-b border-[#f3f6f4] last:border-0 transition hover:bg-[#f8fbf9]">
                    <td className="px-5 py-3.5">
                      <Link href={adminPaths.payment(payment.id)} className="block">
                        <span className="block font-display text-sm font-bold text-[#d1734b]">{formatUGX(payment.amount, payment.currency)}</span>
                        <span className="mt-0.5 block truncate font-mono text-[10px] text-[#9aa7a2]">{referenceOf(payment)}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={adminPaths.payment(payment.id)} className="block">
                        <CustomerCell payment={payment} />
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={adminPaths.payment(payment.id)} className="block">
                        <span className="block text-[13px] font-semibold text-[#3d5650]">{purposeLabel(payment.purpose)}</span>
                        {payment.listings?.title ? (
                          <span className="mt-0.5 block truncate text-[11px] text-[#8b9994]">{payment.listings.title}</span>
                        ) : null}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5eae7] bg-[#f8fbf9] px-2.5 py-1 text-[11px] font-bold text-[#526861]">
                        <RailIcon size={12} className="text-[#d1734b]" />
                        {rail.name}
                        <span className="font-medium text-[#8b9994]">{rail.method}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge value={payment.status} /></td>
                    <td className="px-4 py-3.5">
                      <Link href={adminPaths.payment(payment.id)} className="block">
                        <span className="block text-[13px] font-semibold text-[#3d5650]">{formatDate(payment.created_at)}</span>
                        <span className="mt-0.5 block text-[11px] text-[#8b9994]">{timeAgo(payment.created_at)}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={adminPaths.payment(payment.id)} className="flex size-8 items-center justify-center rounded-full text-[#c3d0cb] transition group-hover:bg-[#eef5f2] group-hover:text-[#315e55]" aria-label={`Open payment ${referenceOf(payment)}`}>
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!loading && !rows.length ? (
          <EmptyState
            icon={Receipt}
            title="No payments match these filters"
            description="Try another status, provider, or reference. Export still includes the current search."
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
