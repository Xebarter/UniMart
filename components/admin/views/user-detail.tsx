'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { useOperator } from '@/components/admin/operator-context'
import { useAdminResource } from '@/components/admin/use-resource'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { formatDateTime, formatUGX, isFeatured } from '@/lib/format'
import type { Listing, Payment, Profile, Report, Shop } from '@/lib/types'

type User360 = { data: Profile; shop: Shop | null; listings: Listing[]; reports: Report[]; payments: Payment[]; conversation_count: number }

export function UserDetailView() {
  const { id } = useParams<{ id: string }>()
  const operator = useOperator()
  const { data, error, loading, reload } = useAdminResource(() => api.adminUser(id), [id])
  const [busy, setBusy] = useState('')
  const [confirm, setConfirm] = useState<{ title: string; description: string; status: string } | null>(null)
  const user = data as User360 | null

  async function patch(body: Record<string, unknown>) {
    setBusy('save')
    try {
      await api.updateUser(id, body)
      await reload()
    } finally {
      setBusy('')
    }
  }

  if (loading && !user) return <p className="text-sm text-[#8b9994]">Loading person…</p>
  if (error) return <p className="text-sm text-[#d1734b]">{error}</p>
  if (!user) return null
  const profile = user.data

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directory / User"
        title={profile.display_name}
        description={[profile.campus, profile.university].filter(Boolean).join(' · ') || 'Member'}
        actions={(
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void patch({ verified: !profile.verified })} className="rounded-xl border border-[#dfe7e3] bg-white px-3 py-2 text-xs font-bold text-[#638076]">
              {profile.verified ? 'Remove verification' : 'Verify student'}
            </button>
            {operator.canManageRoles ? (
              <>
                <select
                  defaultValue={profile.role}
                  disabled={busy === 'save' || profile.id === operator.id}
                  onChange={(event) => void patch({ role: event.target.value })}
                  className="h-9 rounded-xl border border-[#dfe7e3] bg-white px-3 text-xs font-bold text-[#526861]"
                >
                  <option value="student">Student</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="button" onClick={() => setConfirm({ title: 'Suspend account', description: 'They will not be able to post, message, or check out until reinstated.', status: 'suspended' })} className="rounded-xl border border-[#f0c7b3] bg-white px-3 py-2 text-xs font-bold text-[#c86c48]">Suspend</button>
                <button type="button" onClick={() => setConfirm({ title: 'Ban account', description: 'This permanently restricts marketplace access until an admin reinstates them.', status: 'banned' })} className="rounded-xl bg-[#b42318] px-3 py-2 text-xs font-bold text-white">Ban</button>
                {(profile.account_status === 'suspended' || profile.account_status === 'banned') ? (
                  <button type="button" onClick={() => void patch({ account_status: 'active' })} className="rounded-xl bg-[#315e55] px-3 py-2 text-xs font-bold text-white">Reinstate</button>
                ) : null}
              </>
            ) : null}
          </div>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Meta label="Role" value={<StatusBadge value={profile.role} />} />
        <Meta label="Account" value={<StatusBadge value={profile.account_status ?? 'active'} />} />
        <Meta label="Email" value={profile.email || '—'} />
        <Meta label="Student number" value={profile.student_number?.trim() || '—'} />
        <Meta label="Phone" value={profile.phone_primary?.trim() || '—'} />
        <Meta label="Second phone" value={profile.phone_secondary?.trim() || '—'} />
        <Meta label="Joined" value={formatDateTime(profile.created_at)} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Listings</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {user.listings.length ? user.listings.map((listing) => (
              <Link key={listing.id} href={adminPaths.listing(listing.id)} className="flex items-center justify-between rounded-xl px-1 py-1 hover:bg-[#f8fbf9]">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-semibold">{listing.title}</span>
                  {isFeatured(listing) ? <span className="shrink-0 rounded-full bg-[#fff2ec] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#c86c48]">Featured</span> : null}
                </span>
                <StatusBadge value={listing.status} />
              </Link>
            )) : <p className="text-xs text-[#8b9994]">No listings.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Shop</CardTitle></CardHeader>
          <CardContent>
            {user.shop ? (
              <Link href={adminPaths.shop(user.shop.id)} className="font-semibold text-[#315e55]">{user.shop.name}</Link>
            ) : <p className="text-xs text-[#8b9994]">No shop.</p>}
            <p className="mt-3 text-xs text-[#8b9994]">{user.conversation_count} conversations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Reports</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {user.reports.length ? user.reports.map((report) => (
              <Link key={report.id} href={adminPaths.report(report.id)} className="flex items-center justify-between rounded-xl px-1 py-1 hover:bg-[#f8fbf9]">
                <span className="truncate text-sm font-semibold">{report.reason}</span>
                <StatusBadge value={report.status} />
              </Link>
            )) : <p className="text-xs text-[#8b9994]">No reports.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {user.payments.length ? user.payments.map((payment) => (
              <Link key={payment.id} href={adminPaths.payment(payment.id)} className="flex items-center justify-between rounded-xl px-1 py-1 hover:bg-[#f8fbf9]">
                <span className="text-sm font-semibold">{formatUGX(payment.amount, payment.currency)}</span>
                <StatusBadge value={payment.status} />
              </Link>
            )) : <p className="text-xs text-[#8b9994]">No payments.</p>}
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        confirmLabel={confirm?.status === 'banned' ? 'Ban user' : 'Suspend'}
        tone="danger"
        loading={busy === 'save'}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return
          await patch({ account_status: confirm.status })
          setConfirm(null)
        }}
      />
    </div>
  )
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e2e9e5] bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">{label}</p>
      <div className="mt-2 text-sm font-semibold text-[#29463f]">{value}</div>
    </div>
  )
}
