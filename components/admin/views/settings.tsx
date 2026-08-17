'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Database,
  Download,
  ExternalLink,
  Globe,
  KeyRound,
  Lock,
  Minus,
  ScrollText,
  Server,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Users,
  X,
} from 'lucide-react'
import { AdminButton } from '@/components/admin/filter-bar'
import { KpiCard } from '@/components/admin/kpi-card'
import { StatusBadge } from '@/components/admin/status-badge'
import { useOperator } from '@/components/admin/operator-context'
import { useAdminResource } from '@/components/admin/use-resource'
import { Avatar } from '@/components/market/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { adminPaths } from '@/lib/admin/paths'
import { api } from '@/lib/api-client'
import { colorFromSeed, formatDate, formatDateTime, timeAgo } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import type { AdminSettingsSnapshot, AuditLog, Paginated } from '@/lib/types'

const PERMISSIONS: { label: string; student: boolean; moderator: boolean; admin: boolean }[] = [
  { label: 'Browse marketplace', student: true, moderator: true, admin: true },
  { label: 'Moderate listings & shops', student: false, moderator: true, admin: true },
  { label: 'Resolve reports', student: false, moderator: true, admin: true },
  { label: 'Verify student accounts', student: false, moderator: true, admin: true },
  { label: 'Publish magazine articles', student: false, moderator: true, admin: true },
  { label: 'View payments & analytics', student: false, moderator: true, admin: true },
  { label: 'Read message threads', student: false, moderator: true, admin: true },
  { label: 'Change operator roles', student: false, moderator: false, admin: true },
  { label: 'Suspend or ban accounts', student: false, moderator: false, admin: true },
  { label: 'Open console settings', student: false, moderator: false, admin: true },
]

const MIGRATIONS = [
  { file: '001_schema.sql', label: 'Core marketplace schema', probe: 'database' as const },
  { file: '002_admin-roles.sql', label: 'Admin roles & RPC', probe: 'database' as const },
  { file: '008_listing-purchase.sql', label: 'Buyer checkout & sold listings', probe: 'manual' as const },
  { file: '009_admin-ops.sql', label: 'Audit logs, sanctions & shop status', probe: 'ops' as const },
]

const QUICK_LINKS = [
  { href: adminPaths.users, label: 'User directory', hint: 'Roles & verification', icon: Users },
  { href: adminPaths.activity, label: 'Audit log', hint: 'Operator actions', icon: ScrollText },
  { href: adminPaths.analytics, label: 'Analytics', hint: 'Traffic & conversion', icon: Globe },
  { href: '/api/admin/export?type=payments', label: 'Export payments', hint: 'CSV download', icon: Download },
  { href: marketPaths.home, label: 'Marketplace', hint: 'Public storefront', icon: ExternalLink, external: true },
]

function StatusDot({ ok, warn }: { ok: boolean; warn?: boolean }) {
  const tone = ok ? 'bg-[#4e9a7a]' : warn ? 'bg-[#d9a441]' : 'bg-[#d1734b]'
  return <span className={`inline-flex size-2 shrink-0 rounded-full ${tone} ring-2 ring-white`} />
}

function StatusRow({
  label,
  detail,
  ok,
  warn,
}: {
  label: string
  detail: string
  ok: boolean
  warn?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[16px] border border-[#edf1ef] bg-[#fafcfb] px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[#3d5650]">{label}</p>
        <p className="mt-0.5 text-[11px] leading-5 text-[#8b9994]">{detail}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <StatusDot ok={ok} warn={warn} />
        <span className={`text-[10px] font-bold uppercase tracking-[0.08em] ${ok ? 'text-[#3d7a62]' : warn ? 'text-[#b8860b]' : 'text-[#c86c48]'}`}>
          {ok ? 'Ready' : warn ? 'Partial' : 'Missing'}
        </span>
      </div>
    </div>
  )
}

function PermissionCell({ allowed }: { allowed: boolean }) {
  if (allowed) {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#edf6f1] text-[#3d7a62]">
        <Check size={13} strokeWidth={2.5} />
      </span>
    )
  }
  return (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#f3f5f4] text-[#c3ccc8]">
      <Minus size={13} strokeWidth={2.5} />
    </span>
  )
}

function migrationApplied(snapshot: AdminSettingsSnapshot | null, probe: 'database' | 'ops' | 'manual') {
  if (!snapshot) return false
  if (probe === 'database') return snapshot.database === 'ready'
  if (probe === 'ops') return snapshot.schema.ops_ready
  return false
}

function AccessDenied() {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="max-w-md rounded-[28px] border border-[#e5eae7] bg-white p-8 text-center shadow-[0_20px_60px_rgba(36,62,57,0.08)]">
        <span className="mx-auto flex size-14 items-center justify-center rounded-[18px] bg-[#fff5f0] text-[#d1734b] ring-1 ring-[#f5ddd0]">
          <Lock size={24} strokeWidth={2} />
        </span>
        <h1 className="mt-5 font-display text-xl font-bold text-[#29463f]">Admins only</h1>
        <p className="mt-2 text-sm leading-6 text-[#8b9994]">
          Console settings, role management, and platform configuration are limited to full administrators.
        </p>
        <Link href={adminPaths.home} className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#315e55] px-4 text-xs font-bold text-white transition hover:bg-[#294f48]">
          Back to overview
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}

export function SettingsView() {
  const operator = useOperator()
  const { data: settingsPayload, error, loading } = useAdminResource(() => api.adminSettings(), [])
  const { data: auditPayload } = useAdminResource(
    () => (operator.canManageRoles ? api.adminAudit('pageSize=5') : Promise.resolve({ data: [], total: 0, page: 1, pageSize: 5 })),
    [operator.canManageRoles],
  )

  if (!operator.canManageRoles) return <AccessDenied />

  const [advancedOpen, setAdvancedOpen] = useState(false)
  const snapshot = settingsPayload?.data ?? null
  const recentActivity = (auditPayload as Paginated<AuditLog> | null)?.data ?? []
  const firstName = snapshot?.operator.name.split(' ')[0] || operator.name.split(' ')[0] || 'Admin'
  const integrationsReady = snapshot
    ? [
        snapshot.integrations.supabase,
        snapshot.integrations.firebase,
        snapshot.integrations.paytota || snapshot.integrations.dpo,
        snapshot.integrations.app_url,
      ].filter(Boolean).length
    : 0
  const campusLine = [snapshot?.operator.campus, snapshot?.operator.university].filter(Boolean).join(' · ')

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[28px] border border-[#dfe7e3] bg-gradient-to-br from-[#315e55] via-[#2a5049] to-[#1a3c36] px-5 py-7 text-white shadow-[0_20px_60px_rgba(36,62,57,0.18)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-[44%] border-[22px] border-[#47766b]/50 opacity-70" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(241,198,170,0.16),transparent_42%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c7ddd6]">System / Settings</p>
            <h1 className="mt-2 font-display text-[1.85rem] font-bold leading-tight tracking-[-0.04em] sm:text-[2.15rem]">
              Console control center
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#d4e4df] sm:text-[15px]">
              Signed in as {firstName}. Review your session, platform health, and recent operator activity. Infrastructure and runbook tools stay under Advanced settings.
            </p>
            {!loading && snapshot ? (
              <div className="mt-5 flex flex-wrap gap-2.5">
                <HeroChip label="Environment" value={snapshot.environment} />
                <HeroChip label="Database" value={snapshot.database === 'ready' ? 'Connected' : 'Setup needed'} highlight={snapshot.database !== 'ready'} />
                <HeroChip label="Ops schema" value={snapshot.schema.ops_ready ? 'Applied' : 'Pending'} highlight={!snapshot.schema.ops_ready} />
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminButton href={adminPaths.activity}>
              <ScrollText size={14} />
              View audit log
            </AdminButton>
            <AdminButton href={adminPaths.users} variant="primary">
              <Users size={14} />
              Manage roles
            </AdminButton>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">{error}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !snapshot ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[108px] rounded-[22px]" />)
        ) : (
          <>
            <KpiCard
              label="Database"
              value={snapshot.database === 'ready' ? 'Online' : 'Setup'}
              hint={snapshot.database === 'ready' ? 'Supabase reachable' : 'Run 001_schema.sql'}
              icon={Database}
              accent={snapshot.database === 'ready' ? 'green' : 'coral'}
            />
            <KpiCard
              label="Integrations"
              value={`${integrationsReady}/4`}
              hint="Core services configured"
              icon={Server}
              accent={integrationsReady >= 3 ? 'green' : integrationsReady >= 2 ? 'amber' : 'coral'}
            />
            <KpiCard
              label="Payments"
              value={snapshot.integrations.paytota && snapshot.integrations.dpo ? 'Dual' : snapshot.integrations.paytota || snapshot.integrations.dpo ? 'Partial' : 'Off'}
              hint="Paytota · DPO"
              icon={CreditCard}
              accent={snapshot.integrations.paytota || snapshot.integrations.dpo ? 'green' : 'coral'}
            />
            <KpiCard
              label="Ops tooling"
              value={snapshot.schema.ops_ready ? 'Ready' : 'Pending'}
              hint="Audit · sanctions · shops"
              icon={ShieldCheck}
              accent={snapshot.schema.ops_ready ? 'green' : 'amber'}
            />
          </>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Signed-in operator</CardTitle>
            <CardDescription>Your admin identity on this console session</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !snapshot ? (
              <div className="flex items-center gap-4">
                <Skeleton className="size-14 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <Avatar
                  name={snapshot.operator.name}
                  color={colorFromSeed(snapshot.operator.id)}
                  image={snapshot.operator.avatar_url}
                />
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-bold text-[#243e39]">{snapshot.operator.name}</h2>
                      {snapshot.operator.verified ? <BadgeCheck size={16} className="text-[#4e786a]" /> : null}
                      <StatusBadge value={snapshot.operator.role} />
                    </div>
                    <p className="mt-1 text-sm text-[#748780]">{snapshot.operator.email ?? 'No email on file'}</p>
                    {campusLine ? <p className="mt-1 text-[11px] text-[#8b9994]">{campusLine}</p> : null}
                  </div>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <MetaItem label="User id" value={snapshot.operator.id} mono />
                    <MetaItem label="Account status" value={snapshot.operator.account_status} />
                    <MetaItem label="Member since" value={snapshot.operator.created_at ? formatDate(snapshot.operator.created_at) : '—'} />
                    <MetaItem label="Last checked" value={formatDateTime(snapshot.checked_at)} />
                  </dl>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform health</CardTitle>
            <CardDescription>Live checks against database and ops schema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {loading || !snapshot ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[62px] rounded-[16px]" />)
            ) : (
              <>
                <StatusRow label="PostgreSQL" detail="Profiles table reachable via Supabase" ok={snapshot.database === 'ready'} />
                <StatusRow label="Audit logs" detail="Append-only operator action history" ok={snapshot.schema.audit_logs} warn={!snapshot.schema.audit_logs && snapshot.database === 'ready'} />
                <StatusRow label="Account sanctions" detail="Suspend & ban via account_status column" ok={snapshot.schema.account_status} warn={!snapshot.schema.account_status && snapshot.database === 'ready'} />
                <StatusRow label="Shop moderation" detail="Disable storefronts via shops.status" ok={snapshot.schema.shop_status} warn={!snapshot.schema.shop_status && snapshot.database === 'ready'} />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Quick links</CardTitle>
              <CardDescription>Common operator destinations</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon
              const className = "group flex items-center gap-3 rounded-[16px] border border-[#edf1ef] bg-[#fafcfb] px-3.5 py-3 transition hover:border-[#d4e8e0] hover:bg-[#f4faf7]"
              const inner = (
                <>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#315e55] ring-1 ring-[#e2e9e5]">
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-[#3d5650]">{link.label}</span>
                    <span className="mt-0.5 block text-[11px] text-[#8b9994]">{link.hint}</span>
                  </span>
                  <ArrowUpRight size={14} className="shrink-0 text-[#c3d0cb] transition group-hover:text-[#315e55]" />
                </>
              )
              if (link.external) {
                return (
                  <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className={className}>
                    {inner}
                  </a>
                )
              }
              return (
                <Link key={link.href} href={link.href} className={className}>
                  {inner}
                </Link>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Recent operator activity</CardTitle>
              <CardDescription>Latest actions recorded in the audit log</CardDescription>
            </div>
            <Link href={adminPaths.activity} className="text-[11px] font-bold text-[#638076] hover:text-[#315e55]">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-[#dfe7e3] bg-[#fafcfb] px-4 py-8 text-center">
                <ScrollText size={22} className="mx-auto text-[#c3d0cb]" />
                <p className="mt-3 text-sm font-semibold text-[#526861]">No audit entries yet</p>
                <p className="mt-1 text-[12px] text-[#8b9994]">Actions appear here after you run <code className="font-mono">009_admin-ops.sql</code>.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {recentActivity.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3 rounded-[16px] border border-[#edf1ef] bg-[#fafcfb] px-3.5 py-3">
                    {entry.actor ? (
                      <Avatar name={entry.actor.display_name} color={colorFromSeed(entry.actor.id)} image={entry.actor.avatar_url} small />
                    ) : (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#edf4f0] text-[#315e55]">
                        <Shield size={14} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#3d5650]">
                        {entry.actor?.display_name ?? 'System'}
                        <span className="font-normal text-[#8b9994]"> · {entry.action.replaceAll('.', ' · ')}</span>
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[#8b9994]">
                        {entry.entity_type}{entry.entity_id ? ` · ${entry.entity_id.slice(0, 8)}…` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-medium text-[#8b9994]">{timeAgo(entry.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <AdvancedSettingsPanel open={advancedOpen} onToggle={() => setAdvancedOpen((value) => !value)}>
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Environment variables detected on the server (secrets are never shown)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !snapshot ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-[62px] rounded-[16px]" />)}
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <IntegrationChip label="Supabase" detail="Auth, database & storage" ok={snapshot.integrations.supabase} icon={Database} />
                <IntegrationChip label="Firebase / Google" detail="Google sign-in redirect flow" ok={snapshot.integrations.google_auth} icon={KeyRound} />
                <IntegrationChip label="Paytota" detail="Mobile money checkout" ok={snapshot.integrations.paytota} icon={Smartphone} />
                <IntegrationChip label="Paytota webhooks" detail="Payment confirmation" ok={snapshot.integrations.paytota_webhook} warn={snapshot.integrations.paytota && !snapshot.integrations.paytota_webhook} icon={Shield} />
                <IntegrationChip label="DPO" detail="Card payments" ok={snapshot.integrations.dpo} icon={CreditCard} />
                <IntegrationChip label="Public app URL" detail="OG tags & payment callbacks" ok={snapshot.integrations.app_url} icon={Globe} />
                <IntegrationChip label="Service role" detail="Server-side admin operations" ok={snapshot.integrations.service_role} icon={Server} />
                <IntegrationChip
                  label="Canonical URL"
                  detail={snapshot.app_url ?? 'NEXT_PUBLIC_APP_URL not set'}
                  ok={snapshot.integrations.app_url}
                  icon={ExternalLink}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role permissions</CardTitle>
            <CardDescription>What each UniMart role can do in the marketplace and admin console</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#edf1ef] text-[10px] uppercase tracking-[0.12em] text-[#8b9994]">
                  <th className="pb-3 pr-4 font-bold">Capability</th>
                  <th className="px-4 pb-3 text-center font-bold">Student</th>
                  <th className="px-4 pb-3 text-center font-bold">Moderator</th>
                  <th className="pb-3 pl-4 text-center font-bold">Admin</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((row) => (
                  <tr key={row.label} className="border-b border-[#f3f6f4] last:border-0">
                    <td className="py-3 pr-4 text-[13px] font-medium text-[#3d5650]">{row.label}</td>
                    <td className="px-4 py-3 text-center"><PermissionCell allowed={row.student} /></td>
                    <td className="px-4 py-3 text-center"><PermissionCell allowed={row.moderator} /></td>
                    <td className="pl-4 py-3 text-center"><PermissionCell allowed={row.admin} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ops runbook</CardTitle>
            <CardDescription>SQL migrations and bootstrap steps for new environments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-6 text-[#526861]">
              Run scripts in order inside the Supabase SQL editor. The first admin is promoted manually after signup; additional admins are assigned from the Users directory.
            </p>
            <div className="space-y-2">
              {MIGRATIONS.map((migration) => {
                const applied = migrationApplied(snapshot, migration.probe)
                const pending = migration.probe === 'manual' ? null : !applied && snapshot?.database === 'ready'
                return (
                  <div key={migration.file} className="flex items-start gap-3 rounded-[16px] border border-[#edf1ef] bg-[#fafcfb] px-3.5 py-3">
                    <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${applied ? 'bg-[#edf6f1] text-[#3d7a62]' : pending ? 'bg-[#fff9ed] text-[#b8860b]' : 'bg-[#f3f5f4] text-[#8b9994]'}`}>
                      {applied ? <Check size={13} strokeWidth={2.5} /> : pending ? <Minus size={13} /> : <X size={13} />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-bold text-[#315e55]">{migration.file}</p>
                      <p className="mt-0.5 text-[12px] text-[#748780]">{migration.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="rounded-[16px] border border-[#dcebe6] bg-[#f4faf7] px-4 py-3 text-[12px] leading-6 text-[#526861]">
              <p className="font-bold text-[#315e55]">Promote the first admin</p>
              <p className="mt-1">After signup, run <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#29463f]">update profiles set role = &apos;admin&apos; where id = &apos;…&apos;;</code> in Supabase, then refresh this console.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security notes</CardTitle>
            <CardDescription>Operational guardrails for production deployments</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                'Never expose SUPABASE_SERVICE_ROLE_KEY or payment secrets in client bundles.',
                'Set NEXT_PUBLIC_APP_URL to your production domain for OG images and payment callbacks.',
                'Configure Paytota webhooks so listing purchases and boosts confirm reliably.',
                'Audit logs are append-only — use Activity to review who changed roles or sanctions.',
                'Admins cannot suspend or ban their own account; use a second operator for emergencies.',
                'Google sign-in requires Firebase env vars and the redirect handler in the root layout.',
              ].map((note) => (
                <li key={note} className="flex gap-2.5 rounded-[16px] border border-[#edf1ef] bg-[#fafcfb] px-3.5 py-3 text-[12px] leading-6 text-[#526861]">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#4e786a]" />
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </AdvancedSettingsPanel>
    </div>
  )
}

const ADVANCED_TOPICS = ['Integrations', 'Permissions', 'Runbook', 'Security'] as const

function AdvancedSettingsPanel({
  open,
  onToggle,
  children,
}: {
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#d7e2dd] bg-white shadow-[0_18px_50px_rgba(36,62,57,0.07)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="admin-advanced-settings"
        className="group relative flex w-full items-stretch text-left"
      >
        <span className="w-1.5 shrink-0 bg-gradient-to-b from-[#d1734b] via-[#4e786a] to-[#315e55]" />
        <span className="relative flex min-w-0 flex-1 flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-6">
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(209,115,75,0.06),transparent_36%)]" />
          <span className="relative flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#315e55] to-[#1e3d38] text-white shadow-[0_10px_24px_rgba(49,94,85,0.28)]">
            <SlidersHorizontal size={18} strokeWidth={2} />
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#d1734b] text-white ring-2 ring-white">
              <Lock size={8} strokeWidth={2.6} />
            </span>
          </span>
          <span className="relative min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">Restricted</span>
            <span className="mt-1 block font-display text-lg font-bold tracking-[-0.03em] text-[#243e39] sm:text-xl">
              Advanced settings
            </span>
            <span className="mt-1 block max-w-xl text-[12px] leading-5 text-[#8b9994] sm:text-[13px]">
              Integrations, the role matrix, SQL runbook, and production guardrails stay hidden until you need them.
            </span>
            {!open ? (
              <span className="mt-3 flex flex-wrap gap-1.5">
                {ADVANCED_TOPICS.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#e5eae7] bg-[#f7faf8] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8c86]"
                  >
                    {item}
                  </span>
                ))}
              </span>
            ) : null}
          </span>
          <span
            className={`relative inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-full border px-4 text-[12px] font-bold transition sm:self-center ${
              open
                ? 'border-[#315e55] bg-[#315e55] text-white'
                : 'border-[#dfe7e3] bg-white text-[#315e55] group-hover:border-[#315e55] group-hover:bg-[#f4faf7]'
            }`}
          >
            {open ? 'Hide' : 'Reveal'}
            <ChevronDown size={14} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </span>
        </span>
      </button>
      {open ? (
        <div
          id="admin-advanced-settings"
          className="space-y-5 border-t border-[#edf1ef] bg-[linear-gradient(180deg,#f6f9f8_0%,#ffffff_140px)] px-4 py-5 sm:px-6 sm:py-6"
          style={{ animation: 'unimart-dialog-in 320ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          <div className="flex items-start gap-3 rounded-[18px] border border-[#efe4d8] bg-[#fffaf6] px-4 py-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#d1734b] ring-1 ring-[#f0ddd0]">
              <ShieldCheck size={15} />
            </span>
            <p className="text-[12px] leading-5 text-[#7a6a5e]">
              These controls describe production infrastructure. Review them when you are changing env, roles, or schema — not during everyday moderation.
            </p>
          </div>
          {children}
        </div>
      ) : null}
    </section>
  )
}

function HeroChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold ${highlight ? 'border-[#f0c7b3]/40 bg-[#fff5f0]/15 text-[#ffe8dc]' : 'border-white/15 bg-white/10 text-[#e6f0ec]'}`}>
      <span className="text-[#c7ddd6]">{label}</span>
      <span className="capitalize text-white">{value}</span>
    </span>
  )
}

function MetaItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-[14px] border border-[#edf1ef] bg-[#fafcfb] px-3 py-2.5">
      <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8b9994]">{label}</dt>
      <dd className={`mt-1 truncate text-[13px] font-semibold text-[#3d5650] ${mono ? 'font-mono text-[11px]' : ''}`}>{value}</dd>
    </div>
  )
}

function IntegrationChip({
  label,
  detail,
  ok,
  warn,
  icon: Icon,
}: {
  label: string
  detail: string
  ok: boolean
  warn?: boolean
  icon: typeof Database
}) {
  return (
    <div className="flex items-start gap-3 rounded-[16px] border border-[#edf1ef] bg-[#fafcfb] px-3.5 py-3">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-[12px] ring-1 ${ok ? 'bg-[#edf6f1] text-[#315e55] ring-[#d4e8e0]' : warn ? 'bg-[#fff9ed] text-[#b8860b] ring-[#f0e4c8]' : 'bg-[#fff5f0] text-[#d1734b] ring-[#f5ddd0]'}`}>
        <Icon size={16} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-[#3d5650]">{label}</p>
          <StatusDot ok={ok} warn={warn} />
        </div>
        <p className="mt-0.5 truncate text-[11px] text-[#8b9994]">{detail}</p>
      </div>
    </div>
  )
}
