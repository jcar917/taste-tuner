'use client'

import { useState, useEffect } from 'react'

interface Suggestion {
  id: string          // unique ID (OL work key or TMDB ID)
  title: string
  subtitle?: string   // author or year etc.
  mediaType: 'book' | 'movie' | 'tv'
}

// Read TMDB key that we exposed to the browser
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY!

export default function OnboardingPage() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [consumed, setConsumed] = useState<Suggestion[]>([])

  // ───────────────────────────────────────────────────────────
  // Live‑search Open Library + TMDB (debounced 400 ms)
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const [bookSug, screenSug] = await Promise.all([
          fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=5`).then(r => r.json()),
          fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`).then(r => r.json()),
        ])

        // Books – map to suggestions
        const bookPicks: Suggestion[] = (bookSug.docs as any[]).slice(0, 5).map((d) => ({
          id: d.key as string,                // e.g. "/works/OL123W"
          title: d.title as string,
          subtitle: d.author_name?.[0],
          mediaType: 'book',
        }))

        // Movies / TV – map & filter non‑viable results
        const screenPicks: Suggestion[] = (screenSug.results as any[])
          .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
          .slice(0, 5)
          .map((r) => ({
            id: `${r.media_type}_${r.id}`,
            title: r.title || r.name,
            subtitle: r.release_date?.slice(0, 4) || r.first_air_date?.slice(0, 4),
            mediaType: r.media_type,
          }))

        // Merge & de‑duplicate by id
        const merged = [...bookPicks, ...screenPicks].filter(
          (v, i, arr) => arr.findIndex((x) => x.id === v.id) === i,
        )

        setSuggestions(merged)
      } catch (err) {
        console.error(err)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query])

  // ───────────────────────────────────────────────────────────
  function addSuggestion(s: Suggestion) {
    if (consumed.find((c) => c.id === s.id)) return
    setConsumed([...consumed, s])
    setQuery('')
    setSuggestions([])
  }

  // Helper for tiny icon
  const iconFor = (m: Suggestion['mediaType']) =>
    m === 'book' ? '📖' : m === 'movie' ? '🎬' : '📺'

  // ───────────────────────────────────────────────────────────
  return (
    <main className="flex flex-col items-center p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        What have you already read or watched?
      </h1>

      {/* Input + dropdown */}
      <div className="relative w-full">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Start typing a title…"
          className="w-full border rounded-lg p-2"
        />

        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-64 overflow-auto shadow-lg">
            {suggestions.map((s) => (
              <li
                key={s.id}
                onClick={() => addSuggestion(s)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm flex gap-2 items-center text-gray-900"
              >
                <span>{iconFor(s.mediaType)}</span>
                <span>
                  <span className="font-medium">{s.title}</span>
                  {s.subtitle && <span className="text-gray-600"> — {s.subtitle}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirmed list */}
      {consumed.length > 0 && (
        <ul className="mt-6 w-full list-disc list-inside space-y-1">
          {consumed.map((c) => (
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
