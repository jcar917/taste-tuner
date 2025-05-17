'use client'

import { useState, useEffect } from 'react'

interface Suggestion {
  key: string // unique Open Library work key
  title: string
  author?: string
  year?: number
}

export default function OnboardingPage() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [consumed, setConsumed] = useState<Suggestion[]>([])

  // ───────────────────────────────────────────────────────────
  // Live‑search Open Library as the user types (400 ms debounce)
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=7`
        )
        const data = await res.json()
        const picks: Suggestion[] = (data.docs as any[])
          .map((d) => ({
            key: d.key as string,
            title: d.title as string,
            author: d.author_name?.[0] as string | undefined,
            year: d.first_publish_year as number | undefined,
          }))
          .slice(0, 7)
        setSuggestions(picks)
      } catch (err) {
        console.error(err)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query])

  // Add a suggestion to the consumed list (no duplicates)
  function addSuggestion(s: Suggestion) {
    if (consumed.find((c) => c.key === s.key)) return
    setConsumed([...consumed, s])
    setQuery('')
    setSuggestions([])
  }

  return (
    <main className="flex flex-col items-center p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        What have you already read or watched?
      </h1>

      {/* ── Search box & dropdown */}
      <div className="relative w-full">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Start typing a title…"
          className="w-full border rounded-lg p-2"
        />

        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-auto shadow-lg">
            {suggestions.map((s) => (
              <li
                key={s.key}
                onClick={() => addSuggestion(s)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              >
                <span className="font-medium">{s.title}</span>
                {s.author && ` – ${s.author}`}
                {s.year && ` (${s.year})`}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Confirmed list */}
      {consumed.length > 0 && (
        <ul className="mt-6 w-full list-disc list-inside space-y-1">
          {consumed.map((c) => (
            <li key={c.key} className="text-lg">
              {c.title}
              {c.author && ` – ${c.author}`}
              {c.year && ` (${c.year})`}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
