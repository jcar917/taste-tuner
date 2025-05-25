'use client'

import { supabase } from '@/utils/supabaseClient'

export default function LoginPage() {
  async function handleSignIn() {
    // let Supabase use its own callback → it will return to /
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen gap-6 bg-gray-50">
      <h1 className="text-3xl font-bold">Welcome to Taste Tuner</h1>
      <button
        onClick={handleSignIn}
        className="px-6 py-3 rounded-lg bg-blue-600 text-white text-lg hover:bg-blue-700 transition"
      >
        Sign in with Google
      </button>
    </main>
  )
}