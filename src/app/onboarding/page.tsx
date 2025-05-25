'use client'

import { useState, useEffect } from 'react'
import { useSessionContext } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabaseClient'

interface Suggestion {
  id: string
  title: string
  subtitle?: string
  mediaType: 'book' | 'movie' | 'tv'
}

const iconFor = (m: Suggestion['mediaType']) =>
  m === 'book' ? '📖' : m === 'movie' ? '🎬' : '📺'

export default function OnboardingPage() {
  /* ── Supabase auth state ─────────────────────────────── */
  const { session, isLoading } = useSessionContext()
  const userId = session?.user.id
  const router = useRouter()

  /* ─────────────────────────────────────────────────────── */
  // Redirect rules
  if (isLoading) {
    return <p className="p-8 text-center">Loading …</p>
  }
  if (!session) {
    if (typeof window !== 'undefined') router.replace('/login')
    return null
  }

  /* ── UI state ─────────────────────────────────────────── */
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [consumed, setConsumed] = useState<Suggestion[]>([])

  /* ── Load existing rows once ──────────────────────────── */
useEffect(() => {
  if (!userId) return
  ;(async () => {
    const { data, error } = await supabase
      .from('consumed')
      .select('*')
      .eq('user_id', userId)

    if (error) console.error(error)
    else {
      // map DB → Suggestion
      const mapped = data.map((r: any) => ({
        id: r.media_id,
        title: r.title,
        subtitle: r.subtitle,
        mediaType: r.media_type as 'book' | 'movie' | 'tv',
      }))
      setConsumed(mapped)
    }
  })()
}, [userId])

  /* ── Live search Open Library + TMDB (400 ms debounce) ─ */
  useEffect(() => {
    if (query.trim().length < 2) return setSuggestions([])
    const timer = setTimeout(async () => {
      try {
        const [olRaw, tmRaw] = await Promise.all([
          fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=5`).then(r => r.json()),
          fetch(`https://api.themoviedb.org/3/search/multi?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`).then(r => r.json()),
        ])
        const books: Suggestion[] = olRaw.docs.slice(0, 5).map((d: any) => ({
          id: d.key,
          title: d.title,
          subtitle: d.author_name?.[0],
          mediaType: 'book',
        }))
        const screens: Suggestion[] = tmRaw.results
          .filter((r: any) => ['movie', 'tv'].includes(r.media_type))
          .slice(0, 5)
          .map((r: any) => ({
            id: `${r.media_type}_${r.id}`,
            title: r.title || r.name,
            subtitle: r.release_date?.slice(0, 4) || r.first_air_date?.slice(0, 4),
            mediaType: r.media_type,
          }))
        setSuggestions([...books, ...screens])
      } catch (err) {
        console.error(err)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  /* ── Add pick & persist ───────────────────────────────── */
  async function addSuggestion(s: Suggestion) {
    if (consumed.find(c => c.id === s.id)) return
    setConsumed([...consumed, s])
    setQuery('')
    setSuggestions([])

    const { error } = await supabase.from('consumed').insert({
      user_id: userId,
      media_id: s.id,
      media_type: s.mediaType,
      title: s.title,
      subtitle: s.subtitle,
    })
    if (error) console.error(error)
  }

  /* ── Render ───────────────────────────────────────────── */
  return (
    <main className="flex flex-col items-center p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        What have you already read or watched?
      </h1>

      {/* Input & dropdown */}
      <div className="relative w-full">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Start typing a title…"
          className="w-full border rounded-lg p-2"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-auto shadow-lg">
            {suggestions.map(s => (
              <li
                key={s.id}
                onClick={() => addSuggestion(s)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm flex gap-2 items-center text-gray-900"
              >
                <span>{iconFor(s.mediaType)}</span>
                <span>
                  <span className="font-medium">{s.title}</span>
                  {s.subtitle && (
                    <span className="text-gray-600"> — {s.subtitle}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirmed list */}
      {consumed.length > 0 && (
        <ul className="mt-6 w-full list-disc list-inside space-y-1">
          {consumed.map(c => (
            <li key={c.id} className="text-lg">
              {iconFor(c.mediaType)} {c.title}
              {c.subtitle && <span className="text-gray-600"> — {c.subtitle}</span>}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
