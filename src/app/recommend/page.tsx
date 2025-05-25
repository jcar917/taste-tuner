'use client'

import { useEffect, useState } from 'react'
import { useSessionContext } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'

interface Rec {
  id: string
  title: string
  subtitle?: string
  mediaType: 'book' | 'movie' | 'tv'
}
const iconFor = (m: Rec['mediaType']) =>
  m === 'book' ? '📖' : m === 'movie' ? '🎬' : '📺'

export default function RecommendPage() {
  const { session, isLoading } = useSessionContext()
  const router = useRouter()
  const [recs, setRecs] = useState<Rec[]>([])

  // guard like onboarding
  if (isLoading) return <p className="p-8">Loading …</p>
  if (!session) {
    if (typeof window !== 'undefined') router.replace('/login')
    return null
  }

  useEffect(() => {
    fetch('/api/recommend')
      .then((r) => r.json())
      .then(setRecs)
      .catch(console.error)
  }, [])

  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Your next picks</h1>

      {recs.length === 0 ? (
        <p>No recommendations yet.</p>
      ) : (
        <ul className="space-y-2">
          {recs.map((r) => (
            <li key={r.id} className="text-lg">
              {iconFor(r.mediaType)} {r.title}
              {r.subtitle && (
                <span className="text-gray-600"> — {r.subtitle}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
