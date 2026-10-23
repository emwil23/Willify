import type { Play } from './db'

export const WEEK = 7 * 24 * 60 * 60 * 1000

export interface Week {
  plays: number
  artists: { name: string; plays: number }[]
  genre: string | null
  /** Plays per day, oldest first, for the little bar chart. */
  days: number[]
}

/** "Your week in music", from this device's own plays only. */
export function weekInMusic(plays: Play[], now = Date.now()): Week {
  const recent = plays.filter((p) => p.at > now - WEEK && p.at <= now)
  const count = (key: (p: Play) => string | null) => {
    const m = new Map<string, number>()
    for (const p of recent) {
      const k = key(p)
      if (k) m.set(k, (m.get(k) ?? 0) + 1)
    }
    return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }
  const days = Array.from({ length: 7 }, () => 0)
  const DAY = WEEK / 7
  for (const p of recent) {
    const i = 6 - Math.floor((now - p.at) / DAY)
    days[i] = (days[i] ?? 0) + 1
  }
  return {
    plays: recent.length,
    artists: count((p) => p.artist)
      .slice(0, 3)
      .map(([name, n]) => ({ name, plays: n })),
    genre: count((p) => p.genre)[0]?.[0] ?? null,
    days,
  }
}
