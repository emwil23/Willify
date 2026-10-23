import type { Track } from './music'

// Apple's terms allow previews only to promote the music, not as entertainment on their own. So the quiz is
// played on clues, and the preview plays at the reveal, next to the song's Apple Music link and credit.

export const CLUES = 3
export const ROUNDS = 5

export interface Round {
  answer: Track
  /** Four songs, the answer among them, in a fixed shuffled order. */
  options: Track[]
}

/** A small seeded random generator (mulberry32), so a day's challenge is the same for everyone. */
export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 2026-10-23 → 20261023, the seed for that day's challenge. */
export const daySeed = (d: Date) =>
  d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()

function shuffle<T>(items: T[], rand: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j] as T, a[i] as T]
  }
  return a
}

/**
 * Builds the rounds from a pool of songs: each answer gets three wrong options from the same pool.
 * Songs without a preview can't be revealed, so they never become answers.
 */
export function buildRounds(pool: Track[], rand: () => number, rounds = ROUNDS): Round[] {
  const unique = [...new Map(pool.map((t) => [t.id, t])).values()]
  const answers = shuffle(
    unique.filter((t) => t.previewUrl),
    rand,
  ).slice(0, rounds)
  if (unique.length < 4) return []
  return answers.map((answer) => {
    const others = shuffle(
      unique.filter((t) => t.id !== answer.id && t.artist !== answer.artist),
      rand,
    ).slice(0, 3)
    return { answer, options: shuffle([answer, ...others], rand) }
  })
}

/**
 * Points for one round: 300 on the first clue, 200 on the second, 100 on the third, nothing when wrong.
 * A correct streak adds 50 per round already in the streak, up to +200.
 */
export function scoreRound({
  correct,
  cluesUsed,
  streak,
}: {
  correct: boolean
  cluesUsed: number
  streak: number
}) {
  if (!correct) return 0
  const clues = Math.min(Math.max(cluesUsed, 1), CLUES)
  return (CLUES + 1 - clues) * 100 + Math.min(streak, 4) * 50
}

/** Clues without AI, from the song's own details. Never the title or the artist. */
export function fallbackClues(t: Track): string[] {
  return [
    t.genre
      ? `A ${t.genre.toLowerCase()} track${t.year ? ` from ${String(t.year)}` : ''}.`
      : 'A song you may know.',
    t.album && t.album !== t.title
      ? `It's on the release “${t.album.replace(/ - (Single|EP)$/, '')}”.`
      : `Released ${t.year ? `in ${String(t.year)}` : 'a while ago'}.`,
    `The artist's name starts with “${t.artist.trim().charAt(0).toUpperCase()}”.`,
  ]
}

/** Drops AI clues that give the answer away, falling back to the song's own details for those slots. */
export function safeClues(t: Track, ai: string[] | undefined): string[] {
  const banned = [
    ...t.title.toLowerCase().split(/\W+/),
    ...t.artist.toLowerCase().split(/\W+/),
  ].filter((w) => w.length > 3)
  const fallback = fallbackClues(t)
  return Array.from({ length: CLUES }, (_, i) => {
    const clue = ai?.[i]?.trim()
    const leaks = clue && banned.some((w) => clue.toLowerCase().includes(w))
    return clue && !leaks ? clue.slice(0, 140) : (fallback[i] ?? '')
  })
}
