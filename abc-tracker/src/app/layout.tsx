import type { Metadata, Viewport } from 'next'

import { AppShell } from '@/components/layout/app-shell'
import { PwaManager } from '@/components/layout/pwa-manager'
import { Toaster } from 'sonner'

import './globals.css'

export const metadata: Metadata = {
  title: 'ABC Tracker',
  description: 'Log, review, and understand ABC behavior incidents with a calm and mobile-first experience.',
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        <PwaManager />
        <AppShell>{children}</AppShell>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
