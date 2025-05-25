import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

/* ──────────────────────────────────────────────────────────
   TEMPORARY STUB – we’ll replace with real AI picks later
   (titles are filtered so nothing already consumed appears)
   ────────────────────────────────────────────────────────── */
const ALL = [
  { id: '/works/OL82563W', title: 'Neuromancer', subtitle: 'William Gibson', mediaType: 'book' },
  { id: 'movie_268',       title: 'Blade Runner', subtitle: '1982',          mediaType: 'movie' },
  { id: 'tv_1396',         title: 'Breaking Bad', subtitle: '2008',          mediaType: 'tv'    },
  { id: '/works/OL45804W', title: 'Snow Crash',   subtitle: 'Neal Stephenson',mediaType: 'book' },
  { id: 'movie_27205',     title: 'Inception',    subtitle: '2010',          mediaType: 'movie' },
]

export async function GET () {
  /* 1. Read the Supabase access-token cookie */
  const token = cookies().get('sb-access-token')?.value
  let consumedIds: string[] = []

  if (token) {
    /* 2. Create a lightweight server-side Supabase client */
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    /* 3. Identify the user behind the token */
    const { data: { user } } = await supabase.auth.getUser(token)

    /* 4. Fetch that user’s consumed rows */
    if (user) {
      const { data } = await supabase
        .from('consumed')
        .select('media_id')
        .eq('user_id', user.id)
      consumedIds = (data ?? []).map(r => r.media_id)
    }
  }

  /* 5. Filter out anything already consumed */
  const filtered = ALL.filter(r => !consumedIds.includes(r.id))

  return NextResponse.json(filtered)
}
