import { describe, expect, it } from 'vitest'
import { WEEK, weekInMusic } from './stats'

const DAY = WEEK / 7
const now = 1_800_000_000_000
const play = (artist: string, genre: string | null, daysAgo: number) => ({
  trackId: 1,
  artist,
  genre,
  at: now - daysAgo * DAY - 1000,
})

describe('weekInMusic', () => {
  it('counts only the last seven days and ranks artists and genres', () => {
    const w = weekInMusic(
      [
        play('Nujabes', 'Hip-Hop', 0),
        play('Nujabes', 'Hip-Hop', 1),
        play('Bonobo', 'Electronic', 1),
        play('Bonobo', 'Electronic', 2),
        play('Bonobo', null, 3),
        play('Old Fave', 'Rock', 8),
      ],
      now,
    )
    expect(w.plays).toBe(5)
    expect(w.artists).toEqual([
      { name: 'Bonobo', plays: 3 },
      { name: 'Nujabes', plays: 2 },
    ])
    expect(w.genre).toBe('Electronic') // tie broken alphabetically
    expect(w.days).toEqual([0, 0, 0, 1, 1, 2, 1])
  })

  it('is empty with no plays', () => {
    expect(weekInMusic([], now)).toEqual({
      plays: 0,
      artists: [],
      genre: null,
      days: [0, 0, 0, 0, 0, 0, 0],
    })
  })
})
