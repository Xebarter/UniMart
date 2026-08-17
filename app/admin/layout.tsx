import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { AdminShell } from '@/components/admin/shell'
import { BrandLogo } from '@/components/brand-logo'
import { isRestrictedStatus, loadOperator } from '@/lib/admin/account'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Admin console — UniMart',
  description: 'UniMart operations, trust and safety, and marketplace administration.',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/admin')

  const { data: allowed } = await supabase.rpc('is_admin')
  if (!allowed) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background px-3">
        <div className="max-w-md rounded-[28px] border border-[#e5eae7] bg-white p-6 text-center shadow-[0_20px_60px_rgba(36,62,57,0.08)] sm:p-8">
          <BrandLogo size={48} className="justify-center" />
          <h1 className="mt-5 font-display text-2xl font-bold text-foreground">Admin access required</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Your account is signed in, but it is not configured as an administrator.</p>
          <a href="/" className="mt-6 inline-flex rounded-xl bg-[#315e55] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#294f48]">Return to UniMart</a>
        </div>
      </main>
    )
  }

  const operator = await loadOperator(supabase, user.id, user.email || 'Admin')
  if (isRestrictedStatus(operator.accountStatus)) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background px-3">
        <div className="max-w-md rounded-[28px] border border-[#e5eae7] bg-white p-6 text-center shadow-[0_20px_60px_rgba(36,62,57,0.08)] sm:p-8">
          <BrandLogo size={48} className="justify-center" />
          <h1 className="mt-5 font-display text-2xl font-bold text-foreground">Account restricted</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">This operator account is suspended or banned and cannot access the console.</p>
        </div>
      </main>
    )
  }

  return <AdminShell operator={operator}>{children}</AdminShell>
}
