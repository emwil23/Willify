import { describe, expect, it } from 'vitest'
import type { Track } from './music'
import { buildRounds, daySeed, fallbackClues, safeClues, scoreRound, seeded } from './quiz'

const t = (id: number, artist: string, title: string, over: Partial<Track> = {}): Track => ({
  id,
  title,
  artist,
  artistId: null,
  album: `${title} - Single`,
  albumId: null,
  artwork: null,
  previewUrl: 'https://audio-ssl.itunes.apple.com/p.m4a',
  url: 'https://music.apple.com/us/song/1',
  genre: 'Pop',
  year: 2024,
  durationMs: 1,
  explicit: false,
  ...over,
})

const pool = Array.from({ length: 12 }, (_, i) =>
  t(i + 1, `Artist ${String(i)}`, `Song ${String(i)}`),
)

describe('scoreRound', () => {
  it('pays more for fewer clues and nothing for a wrong answer', () => {
    expect(scoreRound({ correct: true, cluesUsed: 1, streak: 0 })).toBe(300)
    expect(scoreRound({ correct: true, cluesUsed: 2, streak: 0 })).toBe(200)
    expect(scoreRound({ correct: true, cluesUsed: 3, streak: 0 })).toBe(100)
    expect(scoreRound({ correct: false, cluesUsed: 1, streak: 3 })).toBe(0)
  })

  it('adds a capped streak bonus and clamps odd clue counts', () => {
    expect(scoreRound({ correct: true, cluesUsed: 1, streak: 2 })).toBe(400)
    expect(scoreRound({ correct: true, cluesUsed: 1, streak: 9 })).toBe(500)
    expect(scoreRound({ correct: true, cluesUsed: 0, streak: 0 })).toBe(300)
    expect(scoreRound({ correct: true, cluesUsed: 7, streak: 0 })).toBe(100)
  })
})

describe('buildRounds', () => {
  it('is the same for the same day and differs between days', () => {
    const a = buildRounds(pool, seeded(daySeed(new Date('2026-10-23T05:00:00Z'))))
    const b = buildRounds(pool, seeded(daySeed(new Date('2026-10-23T22:00:00Z'))))
    const c = buildRounds(pool, seeded(daySeed(new Date('2026-10-24T05:00:00Z'))))
    expect(a.map((r) => r.answer.id)).toEqual(b.map((r) => r.answer.id))
    expect(a.map((r) => r.answer.id)).not.toEqual(c.map((r) => r.answer.id))
  })

  it('gives four distinct options with the answer, never two by the answer’s artist', () => {
    for (const r of buildRounds(pool, seeded(1))) {
      expect(r.options).toHaveLength(4)
      expect(new Set(r.options.map((o) => o.id)).size).toBe(4)
      expect(r.options).toContain(r.answer)
      expect(r.options.filter((o) => o.artist === r.answer.artist)).toHaveLength(1)
    }
  })

  it('never asks about a song without a preview, and needs at least four songs', () => {
    const quiet = pool.map((s, i) => (i < 10 ? { ...s, previewUrl: null } : s))
    const rounds = buildRounds(quiet, seeded(2))
    expect(rounds).toHaveLength(2)
    expect(rounds.every((r) => r.answer.previewUrl)).toBe(true)
    expect(buildRounds(pool.slice(0, 3), seeded(2))).toEqual([])
  })
})

describe('clues', () => {
  const song = t(1, 'Daft Punk', 'Get Lucky', {
    album: 'Random Access Memories',
    year: 2013,
    genre: 'Dance',
  })

  it('builds clues from details without naming the song or artist', () => {
    const clues = fallbackClues(song)
    expect(clues).toHaveLength(3)
    expect(clues.join(' ')).not.toMatch(/lucky|daft punk/i)
    expect(clues[0]).toBe('A dance track from 2013.')
  })

  it('replaces AI clues that leak the answer', () => {
    const clues = safeClues(song, [
      'French duo, 2013 disco revival',
      'Their helmets are famous',
      'Get it, lucky!',
    ])
    expect(clues[0]).toBe('French duo, 2013 disco revival')
    expect(clues[2]).toBe(fallbackClues(song)[2])
    expect(safeClues(song, undefined)).toEqual(fallbackClues(song))
  })
})
