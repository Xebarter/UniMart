import { Analytics } from '@vercel/analytics/next'
import { DM_Sans, Plus_Jakarta_Sans } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { GoogleAuthRedirectHandler } from '@/components/google-auth-redirect'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: 'UniMart — Your campus marketplace',
  description: 'Find it, sell it, and make it yours with UniMart, the trusted marketplace for university communities across Uganda.',
  applicationName: 'UniMart',
  generator: 'UniMart',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    title: 'UniMart',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: 'UniMart — Your campus marketplace',
    description: 'Find it, sell it, and make it yours with UniMart, the trusted marketplace for university communities across Uganda.',
    siteName: 'UniMart',
    images: [{ url: '/web-app-manifest-512x512.png', width: 512, height: 512, alt: 'UniMart' }],
  },
  twitter: {
    card: 'summary',
    title: 'UniMart — Your campus marketplace',
    description: 'Find it, sell it, and make it yours with UniMart, the trusted marketplace for university communities across Uganda.',
    images: ['/web-app-manifest-512x512.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: '#315e55',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${plusJakarta.variable}`}>
      <body className="antialiased">
        <GoogleAuthRedirectHandler />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
