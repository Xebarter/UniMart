import Link from 'next/link'
import { AuthShell } from '@/components/auth-shell'

export default function AuthErrorPage() {
  return (
    <AuthShell
      eyebrow="Sign in"
      title="Link expired"
      description="Please request a new sign-in or confirmation link and try again."
      footer={
        <Link className="font-bold text-[#315e55]" href="/auth/login">
          Try a different method
        </Link>
      }
    >
      <Link
        href="/auth/login"
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#315e55] text-sm font-bold text-white transition hover:bg-[#274c44]"
      >
        Back to sign in
      </Link>
    </AuthShell>
  )
}
