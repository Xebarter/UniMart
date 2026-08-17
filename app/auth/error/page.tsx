import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-3">
      <div className="max-w-md rounded-3xl border border-border bg-card p-6 text-center sm:p-8">
        <BrandLogo size={48} className="justify-center" />
        <h1 className="mt-5 font-display text-2xl font-bold text-foreground">Authentication link expired</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Please request a new sign-in or confirmation link and try again.</p>
        <Link href="/auth/login" className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Back to sign in</Link>
      </div>
    </main>
  )
}
