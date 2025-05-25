'use client'

import { useEffect } from 'react'
import { useSessionContext } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabaseClient'

export default function RootRedirect() {
  const { session, isLoading } = useSessionContext()
  const router = useRouter()

  /* decide where to go once we know auth state */
  useEffect(() => {
    if (isLoading) return             // still figuring out auth

    if (!session) {
      router.replace('/login')
      return
    }

    /* check if user has at least 1 consumed row */
    ;(async () => {
      const { data, error } = await supabase
        .from('consumed')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)

      if (error) {
        console.error(error)
        router.replace('/login')
        return
      }

      if (data.length) {
        router.replace('/recommend')
      } else {
        router.replace('/onboarding')
      }
    })()
  }, [isLoading, session, router])

  /* tiny splash while deciding */
  return (
    <main className="flex items-center justify-center h-screen">
      <p className="text-lg">Redirecting…</p>
    </main>
  )
}
