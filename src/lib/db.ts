import Dexie, { type EntityTable } from 'dexie'
import type { Track } from './music'

export type Feedback = 'up' | 'down' | null

/** A song in a playlist, with the DJ's note and the listener's thumbs. */
export interface PlaylistTrack extends Track {
  why?: string | undefined
  feedback?: Feedback
}

export interface Playlist {
  id: string
  title: string
  /** The words the playlist was made from; empty for hand-made ones. */
  vibe: string
  /** AI liner notes. */
  notes: string | null
  tracks: PlaylistTrack[]
  createdAt: number
  updatedAt: number
}

export interface Like {
  id: number
  track: Track
  at: number
}

/** One preview listened to for at least a few seconds, for "Your week in music". Never leaves the device. */
export interface Play {
  id?: number
  trackId: number
  artist: string
  genre: string | null
  at: number
}

export interface QuizResult {
  /** 'daily-20261023' or 'playlist-<id>-<time>'. */
  id: string
  score: number
  correct: number
  rounds: number
  at: number
}

export const db = new Dexie('willify') as Dexie & {
  playlists: EntityTable<Playlist, 'id'>
  likes: EntityTable<Like, 'id'>
  plays: EntityTable<Play, 'id'>
  quiz: EntityTable<QuizResult, 'id'>
}

db.version(1).stores({
  playlists: 'id, updatedAt',
  likes: 'id, at',
  plays: '++id, at',
  quiz: 'id, at',
})

export const uid = () => crypto.randomUUID()

export async function savePlaylist(
  p: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
) {
  const now = Date.now()
  const existing = p.id ? await db.playlists.get(p.id) : undefined
  const id = p.id ?? uid()
  await db.playlists.put({ ...p, id, createdAt: existing?.createdAt ?? now, updatedAt: now })
  return id
}

export async function toggleLike(track: Track) {
  if (await db.likes.get(track.id)) await db.likes.delete(track.id)
  else await db.likes.put({ id: track.id, track, at: Date.now() })
}
