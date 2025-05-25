'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSessionContext } from '@supabase/auth-helpers-react'
import { supabase } from '@/utils/supabaseClient'

const links = [
  { href: '/onboarding', label: 'Onboarding' },
  { href: '/recommend', label: 'Recommendations' },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { session } = useSessionContext()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  // Hide nav while auth state still loading (session === undefined)
  if (session === undefined) return null

  return (
    <nav className="w-full border-b mb-6 py-3 bg-white">
      <div className="max-w-xl mx-auto flex items-center justify-between px-4">
        <Link href="/" className="font-bold text-lg">
          Taste Tuner
        </Link>

        <ul className="flex gap-4">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`hover:underline ${
                  pathname.startsWith(l.href)
                    ? 'font-semibold'
                    : 'text-gray-600'
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}

          {session && (
            <li>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:underline"
              >
                Log out
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  )
}
