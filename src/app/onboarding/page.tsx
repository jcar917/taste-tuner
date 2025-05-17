'use client'

import { useState } from 'react'

export default function OnboardingPage() {
  const [title, setTitle] = useState('')
  const [consumed, setConsumed] = useState<string[]>([])

  function handleAdd() {
    if (!title.trim()) return
    // Add the cleaned‑up title to the list
    setConsumed([...consumed, title.trim()])
    setTitle('')
  }

  return (
    <main className="flex flex-col items-center p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        What have you already read or watched?
      </h1>

      {/* Input row */}
      <div className="flex w-full gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Start typing a book, movie, or TV show…"
          className="flex-1 border rounded-lg p-2"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-black text-white rounded-lg"
        >
          Add
        </button>
      </div>

      {/* Running list below */}
      {consumed.length > 0 && (
        <ul className="mt-6 w-full list-disc list-inside space-y-1">
          {consumed.map((t, i) => (
            <li key={i} className="text-lg">
              {t}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
