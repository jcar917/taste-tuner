import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

interface Rec {
  id: string
  title: string
  subtitle?: string
  mediaType: 'book' | 'movie' | 'tv'
}

/* ── API handler ────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  /* 1. Access token from Authorization header */
  const bearer = req.headers.get('authorization') || ''
  const token = bearer.startsWith('Bearer ') ? bearer.slice(7) : null
  if (!token) return NextResponse.json([], { status: 401 })

  /* 2. Minimal Supabase client (server-side) */
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  /* 3. Identify the user */
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json([], { status: 401 })

  /* 4. Fetch consumed IDs */
  const { data: consumed } = await supabase
    .from('consumed')
    .select('media_id, media_type')
    .eq('user_id', user.id)

  const consumedIds = (consumed ?? []).map(c => c.media_id)

  /* 5. Build live recommendation list */
  const recs: Rec[] = []

  /* —— books (Open Library) ——————————————— */
  const firstBook = consumed?.find(c => c.media_type === 'book')
  if (firstBook) {
    const workKey = firstBook.media_id                    // /works/OL82563W
    const workJson = await fetch(`https://openlibrary.org${workKey}.json`).then(r => r.json())
    const subject = workJson.subjects?.[0]
    if (subject) {
      const subjJson = await fetch(
        `https://openlibrary.org/subjects/${encodeURIComponent(subject)}.json?limit=7`
      ).then(r => r.json())
      subjJson.works.slice(0, 7).forEach((w: any) => {
        recs.push({
          id: w.key,
          title: w.title,
          subtitle: w.authors?.[0]?.name,
          mediaType: 'book',
        })
      })
    }
  }

  /* —— screen (TMDB) ——————————————————————— */
  const tmdbKey = process.env.NEXT_PUBLIC_TMDB_API_KEY!
  const firstScreen = consumed?.find(c => c.media_type !== 'book')
  if (firstScreen) {
    const [type, rawId] = firstScreen.media_id.split('_') // movie_27205
    const recJson = await fetch(
      `https://api.themoviedb.org/3/${type}/${rawId}/recommendations?api_key=${tmdbKey}&language=en-US&page=1`
    ).then(r => r.json())

    (recJson.results ?? []).slice(0, 7).forEach((r: any) => {
      recs.push({
        id: `${type}_${r.id}`,
        title: r.title || r.name,
        subtitle: (r.release_date || r.first_air_date || '').slice(0, 4),
        mediaType: type as 'movie' | 'tv',
      })
    })
  }

  /* 6. Filter out consumed, dedupe, cap at 10 */
const unique = recs
  .filter(r => !consumedIds.includes(r.id))
  .reduce<Record<string, Rec>>((acc, cur) => {
    acc[cur.id] = cur
    return acc
  }, {})

let final = Object.values(unique).slice(0, 10)

/* 7. If nothing came back, use a tiny stub */
if (final.length === 0) {
  final = [
    { id: '/works/OL153586W', title: 'Dune',        subtitle: 'Frank Herbert', mediaType: 'book'  },
    { id: 'movie_603',        title: 'The Matrix',  subtitle: '1999',          mediaType: 'movie' },
  ]
}

return NextResponse.json(final)