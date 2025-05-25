// src/app/api/recommend/route.ts
import { NextResponse } from 'next/server'

// temporary stub –
const stub = [
  { id: 'book_OL82563W', title: 'Neuromancer', subtitle: 'William Gibson', mediaType: 'book' },
  { id: 'movie_268',     title: 'Blade Runner', subtitle: '1982',           mediaType: 'movie' },
  { id: 'tv_1396',       title: 'Breaking Bad', subtitle: '2008',           mediaType: 'tv'    },
  { id: 'book_OL45804W', title: 'Snow Crash',   subtitle: 'Neal Stephenson',mediaType: 'book' },
  { id: 'movie_27205',   title: 'Inception',    subtitle: '2010',           mediaType: 'movie' },
]

export async function GET () {
  // TODO: use cookies to grab the user ID & filter out consumed
  return NextResponse.json(stub)
}
