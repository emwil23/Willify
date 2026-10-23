// The iTunes catalogue, through ew-apps-api's cached /api/music routes. Shapes match src/music.ts there.
// Previews and artwork always load straight from Apple: Apple's terms forbid storing or re-hosting them.

export interface Track {
  id: number
  title: string
  artist: string
  artistId: number | null
  album: string | null
  albumId: number | null
  artwork: string | null
  previewUrl: string | null
  url: string
  genre: string | null
  year: number | null
  durationMs: number | null
  explicit: boolean
}

export interface Album {
  id: number
  title: string
  artist: string
  artistId: number | null
  artwork: string | null
  url: string
  genre: string | null
  year: number | null
  trackCount: number | null
}

export interface Artist {
  id: number
  name: string
  genre: string | null
  url: string
}

export type MusicItem =
  ({ kind: 'track' } & Track) | ({ kind: 'album' } & Album) | ({ kind: 'artist' } & Artist)

export type Entity = 'song' | 'album' | 'musicArtist'

const API_URL = import.meta.env.VITE_API_URL as string | undefined
export const musicConfigured = Boolean(API_URL)

export class MusicError extends Error {
  constructor(
    message: string,
    readonly busy = false,
  ) {
    super(message)
  }
}

const memo = new Map<string, Promise<MusicItem[]>>()

async function get(
  path: string,
  params: Record<string, string | number | undefined>,
  signal?: AbortSignal,
) {
  if (!API_URL) throw new MusicError('Music search is not set up on this deployment.')
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined) qs.set(k, String(v))
  const key = `${path}?${qs.toString()}`
  let hit = memo.get(key)
  if (!hit) {
    // Shared by every caller asking the same thing, so one caller's cancel must not abort the fetch.
    hit = fetch(`${API_URL}/api/music/${key}`).then(async (res) => {
      if (res.status === 503)
        throw new MusicError('iTunes is busy right now. Try again in a minute.', true)
      if (!res.ok) throw new MusicError('Music search failed. Please try again.')
      return ((await res.json()) as { results: MusicItem[] }).results
    })
    memo.set(key, hit)
    // Failed calls are forgotten, so the next try goes out again.
    hit.catch(() => memo.delete(key))
  }
  if (!signal) return hit
  signal.throwIfAborted()
  const cancelled = new Promise<never>((_, reject) =>
    signal.addEventListener('abort', () => reject(signal.reason as Error), { once: true }),
  )
  return Promise.race([hit, cancelled])
}

const isTrack = (i: MusicItem): i is { kind: 'track' } & Track => i.kind === 'track'
const isAlbum = (i: MusicItem): i is { kind: 'album' } & Album => i.kind === 'album'
const isArtist = (i: MusicItem): i is { kind: 'artist' } & Artist => i.kind === 'artist'

export const searchTracks = async (
  term: string,
  country: string,
  limit = 20,
  signal?: AbortSignal,
) => (await get('search', { term, entity: 'song', limit, country }, signal)).filter(isTrack)

export const searchAlbums = async (term: string, country: string, signal?: AbortSignal) =>
  (await get('search', { term, entity: 'album', limit: 24, country }, signal)).filter(isAlbum)

export const searchArtists = async (term: string, country: string, signal?: AbortSignal) =>
  (await get('search', { term, entity: 'musicArtist', limit: 20, country }, signal)).filter(
    isArtist,
  )

/** An album and its songs (iTunes returns the album first, then the tracks). */
export async function albumWithTracks(id: number, country: string) {
  const items = await get('lookup', { id, entity: 'song', limit: 100, country })
  return { album: items.find(isAlbum) ?? null, tracks: items.filter(isTrack) }
}

/** An artist with their top songs and albums. */
export async function artistPage(id: number, country: string) {
  const [songs, albums] = await Promise.all([
    get('lookup', { id, entity: 'song', limit: 20, country }),
    get('lookup', { id, entity: 'album', limit: 30, country }),
  ])
  return {
    artist: songs.find(isArtist) ?? albums.find(isArtist) ?? null,
    tracks: songs.filter(isTrack),
    albums: albums.filter(isAlbum),
  }
}

/** Apple's most-played songs in this country, with previews. */
export const charts = async (country: string) =>
  (await get('charts', { country: country.toLowerCase() })).filter(isTrack)

/**
 * Artwork at another size. iTunes documents 100x100 only; the same CDN serves other sizes by name, so the
 * image element falls back to `src` (the 100px original) if a larger one fails.
 */
export const artworkAt = (url: string | null, size: number) =>
  url?.replace(/\/\d+x\d+bb\.(jpg|png|webp)$/, `/${String(size)}x${String(size)}bb.$1`) ?? null

const AFFILIATE = (import.meta.env.VITE_APPLE_AFFILIATE_TOKEN as string | undefined) ?? ''

/** An Apple Music link with the Performance Partners token (if one is configured) and a campaign tag. */
export function appleMusicUrl(url: string, token = AFFILIATE) {
  if (!token) return url
  const u = new URL(url)
  u.searchParams.set('at', token)
  u.searchParams.set('ct', 'willify')
  return u.toString()
}

export const formatDuration = (ms: number | null) => {
  if (!ms) return ''
  const s = Math.round(ms / 1000)
  return `${String(Math.floor(s / 60))}:${String(s % 60).padStart(2, '0')}`
}
