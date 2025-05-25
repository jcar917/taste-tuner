import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

interface Rec {
  id: string
  title: string
  subtitle?: string
  mediaType: 'book' | 'movie' | 'tv'
}

const safeJson = async (res: Response) => {
  try {
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) return null
    return await res.json()
  } catch { return null }
}

export async function GET(req: NextRequest) {
  /* 1. auth */
  const bearer = req.headers.get('authorization') || ''
  const token  = bearer.startsWith('Bearer ') ? bearer.slice(7) : null
  if (!token || token === 'undefined') return NextResponse.json([], { status: 401 })

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

  /* ── BOOK recs ────────────────────────────────────────── */
  const bookSeeds = consumed.filter(c => c.media_type === 'book').slice(0, 5)
  let gotBook = false

  for (const seed of bookSeeds) {
    const work = await safeJson(
      await fetch(`https://openlibrary.org${seed.media_id}.json`)
    )
    if (!work) continue

    /* by subject */
    const subject = work.subjects?.[0]
    if (subject) {
      const subj = await safeJson(
        await fetch(
          `https://openlibrary.org/subjects/${encodeURIComponent(subject)}.json?limit=8`
        )
      )
      if (subj?.works?.length) {
        subj.works.slice(0, 5).forEach((w: any) =>
          recs.push({
            id: w.key,
            title: w.title,
            subtitle: w.authors?.[0]?.name,
            mediaType: 'book',
          }),
        )
        gotBook = true
        break
      }
    }

    /* fallback by author */
    const authorKey = work.authors?.[0]?.author?.key
    if (authorKey) {
      const a = await safeJson(
        await fetch(`https://openlibrary.org${authorKey}/works.json?limit=10`)
      )
      if (a?.entries?.length) {
        a.entries.slice(0, 5).forEach((w: any) =>
          recs.push({
            id: w.key,
            title: w.title,
            subtitle: work.authors?.[0]?.author?.name,
            mediaType: 'book',
          }),
        )
        gotBook = true
        break
      }
    }
  }

  /* global fallback subject if still no books */
  if (!gotBook) {
    const sf = await safeJson(
      await fetch('https://openlibrary.org/subjects/science_fiction.json?limit=8')
    )
    sf?.works?.slice(0, 5).forEach((w: any) =>
      recs.push({
        id: w.key,
        title: w.title,
        subtitle: w.authors?.[0]?.name,
        mediaType: 'book',
      }),
    )
  }

  /* ── MOVIE / TV recs (unchanged) ─────────────────────── */
  const tmdbKey = process.env.NEXT_PUBLIC_TMDB_API_KEY!
  const screenSeeds = consumed.filter(c => c.media_type !== 'book').slice(0, 3)

  for (const seed of screenSeeds) {
    const [type, rawId] = seed.media_id.split('_')
    const recJson = await safeJson(
      await fetch(
        `https://api.themoviedb.org/3/${type}/${rawId}/recommendations?api_key=${tmdbKey}&language=en-US&page=1`
      )
    )
    if (!recJson?.results?.length) continue
    recJson.results.slice(0, 5).forEach((r: any) =>
      recs.push({
        id: `${type}_${r.id}`,
        title: r.title || r.name,
        subtitle: (r.release_date || r.first_air_date || '').slice(0, 4),
        mediaType: type as 'movie' | 'tv',
      }),
    )
    break
  }

  /* ── filter consumed + dedupe ────────────────────────── */
  const unique = recs
    .filter(r => !consumedIds.includes(r.id))
    .reduce<Record<string, Rec>>((a, c) => {
      a[c.id] = c
      return a
    }, {})
  return NextResponse.json(Object.values(unique).slice(0, 10))
}
