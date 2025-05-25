import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

import SupabaseProvider from '@/components/SupabaseProvider'
import NavBar from '@/components/NavBar'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Taste Tuner',
  description: 'Cross-media recommender MVP',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased bg-white text-gray-900">
        <SupabaseProvider>
          <NavBar />      {/* ← new global nav bar */}
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}
