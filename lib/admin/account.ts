import type { AccountStatus, AdminOperator, UserRole } from '@/lib/types'
import type { createClient as createServerSupabase } from '@/lib/supabase/server'

type Supabase = Awaited<ReturnType<typeof createServerSupabase>>

export function isRestrictedStatus(status?: string | null): status is 'suspended' | 'banned' {
  return status === 'suspended' || status === 'banned'
}

export async function loadOperator(supabase: Supabase, userId: string, fallbackName: string): Promise<AdminOperator> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role, account_status')
    .eq('id', userId)
    .maybeSingle()

  if (error && /account_status/i.test(error.message ?? '')) {
    const fallback = await supabase.from('profiles').select('id, display_name, role').eq('id', userId).maybeSingle()
    const role = (fallback.data?.role ?? 'moderator') as UserRole
    return {
      id: userId,
      name: fallback.data?.display_name || fallbackName,
      role,
      canManageRoles: role === 'admin',
      accountStatus: 'active',
    }
  }

  const role = (data?.role ?? 'moderator') as UserRole
  return {
    id: userId,
    name: data?.display_name || fallbackName,
    role,
    canManageRoles: role === 'admin',
    accountStatus: (data?.account_status as AccountStatus | undefined) ?? 'active',
  }
}

export async function loadAccountStatus(supabase: Supabase, userId: string): Promise<AccountStatus> {
  const { data, error } = await supabase.from('profiles').select('account_status').eq('id', userId).maybeSingle()
  if (error || !data) return 'active'
  return ((data as { account_status?: AccountStatus }).account_status ?? 'active')
}

export function isMissingOpsSchema(error: { message?: string } | null) {
  const message = error?.message ?? ''
  return /schema cache|does not exist|could not find the table|account_status|audit_logs|shops\.status/i.test(message)
}
