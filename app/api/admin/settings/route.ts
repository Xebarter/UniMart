import { jsonOk, requireFullAdmin } from '@/lib/api/http'

async function probeColumn(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  table: string,
  column: string,
) {
  const { error } = await supabase.from(table).select(column).limit(1)
  return !error
}

async function probeTable(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  table: string,
) {
  const { error } = await supabase.from(table).select('id').limit(1)
  return !error
}

export async function GET() {
  const auth = await requireFullAdmin()
  if (auth.response) return auth.response

  const { error: dbProbeError } = await auth.supabase.from('profiles').select('id').limit(1)
  const database = dbProbeError ? 'uninitialized' : 'ready'

  const [auditLogs, accountStatus, shopStatus, jobRoles, pressPages] = await Promise.all([
    probeTable(auth.supabase, 'audit_logs'),
    probeColumn(auth.supabase, 'profiles', 'account_status'),
    probeColumn(auth.supabase, 'shops', 'status'),
    probeTable(auth.supabase, 'job_roles'),
    probeTable(auth.supabase, 'press_pages'),
  ])

  const { data: profile } = await auth.supabase
    .from('profiles')
    .select('id, display_name, role, account_status, avatar_url, created_at, verified, campus, university')
    .eq('id', auth.user!.id)
    .maybeSingle()

  return jsonOk({
    data: {
      checked_at: new Date().toISOString(),
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      app_url: process.env.NEXT_PUBLIC_APP_URL ?? null,
      database,
      schema: {
        audit_logs: auditLogs,
        account_status: accountStatus,
        shop_status: shopStatus,
        job_roles: jobRoles,
        press_pages: pressPages,
        ops_ready: auditLogs && accountStatus && shopStatus,
      },
      integrations: {
        supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        firebase: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
        google_auth: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
        paytota: Boolean(process.env.PAYTOTA_SECRET_KEY && process.env.PAYTOTA_BRAND_ID),
        paytota_webhook: Boolean(process.env.PAYTOTA_WEBHOOK_PUBLIC_KEY),
        dpo: Boolean(process.env.DPO_COMPANY_TOKEN || process.env.HOSTED_CHECKOUT_COMPANY_TOKEN),
        app_url: Boolean(process.env.NEXT_PUBLIC_APP_URL),
        service_role: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      },
      operator: {
        id: auth.user!.id,
        email: auth.user!.email ?? null,
        name: profile?.display_name || auth.user!.email || 'Admin',
        role: profile?.role ?? auth.operator?.role ?? 'admin',
        account_status: profile?.account_status ?? 'active',
        avatar_url: profile?.avatar_url ?? null,
        verified: profile?.verified ?? false,
        created_at: profile?.created_at ?? null,
        campus: profile?.campus ?? null,
        university: profile?.university ?? null,
      },
    },
  })
}
