import { aiLines, aiReady } from '@/ai/run'
import type { PlaylistTrack } from './db'
import { verify, type Suggestion } from './match'
import { searchTracks } from './music'

export const PLAYLIST_SIZE = 12

export type DjEvent =
  | { type: 'start'; ai: boolean }
  | { type: 'track'; track: PlaylistTrack }
  | { type: 'dropped'; suggestion: Suggestion }

async function* suggestionsFrom(
  lines: AsyncIterable<{ artist?: unknown; title?: unknown; why?: unknown }>,
) {
  for await (const l of lines)
    if (typeof l.artist === 'string' && typeof l.title === 'string')
      yield {
        artist: l.artist,
        title: l.title,
        why: typeof l.why === 'string' ? l.why.slice(0, 140) : undefined,
      }
}

/**
 * Makes a playlist for a vibe, or reworks one. With AI, every suggestion is checked against iTunes and
 * dropped if it isn't there. Without AI, it falls back to an iTunes search for the vibe's own words.
 */
export async function* runDj(
  opts: {
    vibe: string
    country: string
    signal: AbortSignal
    /** To rework an existing playlist. */
    refine?: { instruction: string; tracks: PlaylistTrack[] }
  },
  size = PLAYLIST_SIZE,
): AsyncGenerator<DjEvent> {
  const { vibe, country, signal, refine } = opts
  const ai = await aiReady()
  yield { type: 'start', ai }

  if (!ai) {
    if (refine) throw new Error('Refining a playlist needs AI. Pick a provider in Settings.')
    const found = await searchTracks(vibe, country, 40, signal)
    const perArtist = new Map<string, number>()
    let n = 0
    for (const t of found) {
      const seen = perArtist.get(t.artist) ?? 0
      if (!t.previewUrl || seen >= 2) continue
      perArtist.set(t.artist, seen + 1)
      yield { type: 'track', track: t }
      if (++n >= size) return
    }
    return
  }

  const lines = refine
    ? aiLines(
        'refine',
        {
          vibe,
          instruction: refine.instruction,
          tracks: refine.tracks.map((t) => ({
            artist: t.artist,
            title: t.title,
            feedback: t.feedback ?? null,
          })),
          count: size,
        },
        signal,
      )
    : aiLines('vibe', { vibe, count: size }, signal)

  let kept = 0
  for await (const r of verify(suggestionsFrom(lines), (term) =>
    searchTracks(term, country, 10, signal),
  )) {
    signal.throwIfAborted()
    if (!r.track) {
      yield { type: 'dropped', suggestion: r.suggestion }
      continue
    }
    const before = refine?.tracks.find((t) => t.id === r.track?.id)
    yield { type: 'track', track: { ...r.track, feedback: before?.feedback ?? null } }
    if (++kept >= size) return
  }
}
