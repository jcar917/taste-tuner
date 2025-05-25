import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

interface Rec {
  id: string
  title: string
  subtitle?: string
  mediaType: 'book' | 'movie' | 'tv'
}

export async function GET(req: NextRequest) {
  /* 1. token → user */
  const bearer = req.headers.get('authorization') || ''
  const token  = bearer.startsWith('Bearer ') ? bearer.slice(7) : null
  if (!token) return NextResponse.json([], { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json([], { status: 401 })

  /* 2. consumed rows */
  const { data: consumed = [] } = await supabase
    .from('consumed')
    .select('media_id, media_type')
    .eq('user_id', user.id)

  const consumedIds = consumed.map(c => c.media_id)

  const recs: Rec[] = []

  /* ── BOOK recommendations ────────────────────────────── */
  const bookSeeds = consumed.filter(c => c.media_type === 'book').slice(0, 3)
  for (const seed of bookSeeds) {
    try {
      const work = await fetch(`https://openlibrary.org${seed.media_id}.json`).then(r => r.json())
      const subject = work.subjects?.[0]
      if (!subject) continue          // try next seed
      const subj = await fetch(
        `https://openlibrary.org/subjects/${encodeURIComponent(subject)}.json?limit=8`
      ).then(r => r.json())
      subj.works.slice(0, 5).forEach((w: any) => {
        recs.push({
          id: w.key,
          title: w.title,
          subtitle: w.authors?.[0]?.name,
          mediaType: 'book',
        })
      })
      break                           // got something → stop looping
    } catch { /* ignore and try next seed */ }
  }

  /* ── MOVIE / TV recommendations ──────────────────────── */
  const tmdbKey = process.env.NEXT_PUBLIC_TMDB_API_KEY!
  const screenSeeds = consumed.filter(c => c.media_type !== 'book').slice(0, 3)
  for (const seed of screenSeeds) {
    try {
      const [type, rawId] = seed.media_id.split('_')  // movie_27205
      const recJson = await fetch(
        `https://api.themoviedb.org/3/${type}/${rawId}/recommendations?api_key=${tmdbKey}&language=en-US&page=1`
      ).then(r => r.json())
      if (!recJson.results?.length) continue
      recJson.results.slice(0, 5).forEach((r: any) => {
        recs.push({
          id: `${type}_${r.id}`,
          title: r.title || r.name,
          subtitle: (r.release_date || r.first_air_date || '').slice(0, 4),
          mediaType: type as 'movie' | 'tv',
        })
      })
      break
    } catch { /* try next seed */ }
  }

  /* ── Filter duplicates & consumed ────────────────────── */
  const unique = recs
    .filter(r => !consumedIds.includes(r.id))
    .reduce<Record<string, Rec>>((acc, cur) => {
      acc[cur.id] = cur
      return acc
    }, {})

  const final = Object.values(unique).slice(0, 10)
  return NextResponse.json(final)
}
