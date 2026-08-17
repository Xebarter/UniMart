import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin-dashboard'
import { BrandLogo } from '@/components/brand-logo'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/admin')
  const { data: allowed } = await supabase.rpc('is_admin')
  if (!allowed) return (
    <main className="flex min-h-screen items-center justify-center bg-background px-3">
      <div className="max-w-md rounded-3xl border border-border bg-card p-6 text-center sm:p-8">
        <BrandLogo size={48} className="justify-center" />
        <h1 className="mt-5 font-display text-2xl font-bold text-foreground">Admin access required</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Your account is signed in, but it is not configured as an administrator.</p>
        <a href="/" className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Return to UniMart</a>
      </div>
    </main>
  )
  const { data: profile } = await supabase.from('profiles').select('display_name, role').eq('id', user.id).maybeSingle()
  return <AdminDashboard name={profile?.display_name || user.email || 'Admin'} currentUserId={user.id} canManageRoles={profile?.role === 'admin'} />
}
