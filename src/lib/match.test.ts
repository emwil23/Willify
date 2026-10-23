import { describe, expect, it } from 'vitest'
import { artistMatches, bestMatch, normalize, titleMatches, verify, type Suggestion } from './match'
import type { Track } from './music'

let nextId = 1
const track = (artist: string, title: string, over: Partial<Track> = {}): Track => ({
  id: nextId++,
  title,
  artist,
  artistId: null,
  album: null,
  albumId: null,
  artwork: null,
  previewUrl: 'https://audio-ssl.itunes.apple.com/p.m4a',
  url: 'https://music.apple.com/us/song/1',
  genre: 'Pop',
  year: 2000,
  durationMs: 200000,
  explicit: false,
  ...over,
})

describe('normalize', () => {
  it('drops accents, version notes, features and punctuation', () => {
    expect(normalize('Beyoncé')).toBe('beyonce')
    expect(normalize('Get Lucky (feat. Pharrell Williams) [Radio Edit]')).toBe('get lucky')
    expect(normalize('Here Comes the Sun - Remastered 2009')).toBe('here comes the sun')
    expect(normalize('The Weeknd')).toBe('weeknd')
    expect(normalize("Rock 'n' Roll & Me")).toBe('rock n roll and me')
  })
})

describe('titleMatches / artistMatches', () => {
  it('accepts small spelling differences and rejects other songs', () => {
    expect(titleMatches('Dont Stop Me Now', "Don't Stop Me Now (2011 Remaster)")).toBe(true)
    expect(titleMatches('Bohemian Rhapsody', 'Killer Queen')).toBe(false)
  })

  it('finds the artist inside a credit with several names, and keeps band names whole', () => {
    expect(artistMatches('Daft Punk', 'Daft Punk, Pharrell Williams & Nile Rodgers')).toBe(true)
    expect(artistMatches('Daft Punk & Pharrell', 'Daft Punk')).toBe(true)
    expect(artistMatches('Earth, Wind & Fire', 'Earth, Wind & Fire')).toBe(true)
    expect(artistMatches('Nujabes', 'Fat Jon')).toBe(false)
  })
})

describe('bestMatch', () => {
  const s: Suggestion = { artist: 'Nujabes', title: 'Aruarian Dance' }

  it('returns null for a song that does not exist', () => {
    const found = [track('Nujabes', 'Feather'), track('Some Band', 'Aruarian Dance')]
    expect(bestMatch({ artist: 'Nujabes', title: 'Moonlit Syntax' }, found)).toBeNull()
    expect(bestMatch(s, found)).toBeNull() // right title, wrong artist
  })

  it('prefers the original with a preview over karaoke, tributes and live takes', () => {
    const karaoke = track('Nujabes', 'Aruarian Dance (Karaoke Version)')
    const live = track('Nujabes', 'Aruarian Dance (Live)')
    const noPreview = track('Nujabes', 'Aruarian Dance', { previewUrl: null })
    const original = track('Nujabes', 'Aruarian Dance')
    expect(bestMatch(s, [karaoke, noPreview, live, original])?.id).toBe(original.id)
    expect(bestMatch(s, [karaoke])).toBeNull()
  })
})

describe('verify', () => {
  it('checks suggestions as they stream in, drops made-up and duplicate songs, keeps the why', async () => {
    const real = track('Daft Punk', 'Get Lucky')
    const catalogue: Record<string, Track[]> = {
      'Daft Punk Get Lucky': [real],
      'Daft Punk Get lucky': [real],
      'Daft Punk Imaginary Song': [track('Daft Punk', 'One More Time')],
    }
    const searches: string[] = []
    const search = (term: string) => {
      searches.push(term)
      return Promise.resolve(catalogue[term] ?? [])
    }
    async function* stream(): AsyncGenerator<Suggestion> {
      yield { artist: 'Daft Punk', title: 'Get Lucky', why: 'sunny groove' }
      yield { artist: 'Daft Punk', title: 'Imaginary Song' }
      yield { artist: 'Daft Punk', title: 'Get lucky' }
      yield { artist: ' ', title: 'Nothing' }
    }
    const out = []
    for await (const r of verify(stream(), search, 2)) out.push(r)
    expect(out).toHaveLength(3)
    expect(out.flatMap((r) => (r.track ? [r.track] : []))).toEqual([
      { ...real, why: 'sunny groove' },
    ])
    expect(searches).not.toContain(' Nothing')
  })

  it('treats a failed search as not found', async () => {
    const out = []
    for await (const r of verify([{ artist: 'A', title: 'B' }], () =>
      Promise.reject(new Error('x')),
    ))
      out.push(r)
    expect(out).toEqual([{ suggestion: { artist: 'A', title: 'B' }, track: null }])
  })
})
