import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

import SupabaseProvider from '@/components/SupabaseProvider'  // client-side wrapper

/* ─── Font setup ──────────────────────────────────────────── */
const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

/* ─── <head> metadata ─────────────────────────────────────── */
export const metadata: Metadata = {
  title: 'Taste Tuner',
  description: 'Cross-media recommender MVP',
}

/* ─── Root layout ─────────────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}   /* exposes CSS vars */
    >
      <body className="antialiased bg-white text-gray-900">
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  )
}
