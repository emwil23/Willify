// The genre galaxy: four spiral arms, each a family of genres running from the centre outwards, so
// neighbours on an arm sound alike. Each genre names a few artists who define it; the galaxy plays their
// songs (found on iTunes) as examples, so every example is a real recording.

export interface Arm {
  name: string
  /** Hue in degrees, for the arm's light. */
  hue: number
  genres: { name: string; seeds: string[] }[]
}

export const ARMS: Arm[] = [
  {
    name: 'Soul & rhythm',
    hue: 18,
    genres: [
      { name: 'Gospel', seeds: ['Mahalia Jackson', 'Kirk Franklin'] },
      { name: 'Blues', seeds: ['B.B. King', 'Muddy Waters'] },
      { name: 'Soul', seeds: ['Aretha Franklin', 'Otis Redding'] },
      { name: 'Funk', seeds: ['Parliament', 'James Brown'] },
      { name: 'Disco', seeds: ['Donna Summer', 'Chic'] },
      { name: 'R&B', seeds: ['SZA', 'Usher'] },
      { name: 'Neo-soul', seeds: ['Erykah Badu', "D'Angelo"] },
      { name: 'Afrobeats', seeds: ['Burna Boy', 'Wizkid'] },
      { name: 'Amapiano', seeds: ['Kabza De Small', 'Tyla'] },
      { name: 'Dancehall', seeds: ['Sean Paul', 'Shenseea'] },
      { name: 'Reggae', seeds: ['Bob Marley & The Wailers', 'Toots & The Maytals'] },
    ],
  },
  {
    name: 'Electronic',
    hue: 252,
    genres: [
      { name: 'Classical', seeds: ['Max Richter', 'Ludovico Einaudi'] },
      { name: 'Ambient', seeds: ['Brian Eno', 'Aphex Twin'] },
      { name: 'Lo-fi', seeds: ['Jinsang', 'idealism'] },
      { name: 'Synthwave', seeds: ['The Midnight', 'FM-84'] },
      { name: 'House', seeds: ['Frankie Knuckles', 'Fred again..'] },
      { name: 'Deep house', seeds: ['Kerri Chandler', 'Disclosure'] },
      { name: 'Techno', seeds: ['Jeff Mills', 'Charlotte de Witte'] },
      { name: 'Trance', seeds: ['Tiësto', 'Armin van Buuren'] },
      { name: 'Drum & bass', seeds: ['Goldie', 'Chase & Status'] },
      { name: 'Dubstep', seeds: ['Burial', 'Skrillex'] },
    ],
  },
  {
    name: 'Guitars',
    hue: 158,
    genres: [
      { name: 'Folk', seeds: ['Joni Mitchell', 'Bob Dylan'] },
      { name: 'Rock & roll', seeds: ['Chuck Berry', 'Little Richard'] },
      { name: 'Classic rock', seeds: ['Led Zeppelin', 'Fleetwood Mac'] },
      { name: 'Punk', seeds: ['The Clash', 'Ramones'] },
      { name: 'Grunge', seeds: ['Nirvana', 'Pearl Jam'] },
      { name: 'Alternative', seeds: ['Radiohead', 'The Smashing Pumpkins'] },
      { name: 'Indie rock', seeds: ['Arctic Monkeys', 'The Strokes'] },
      { name: 'Shoegaze', seeds: ['My Bloody Valentine', 'Slowdive'] },
      { name: 'Metal', seeds: ['Metallica', 'Black Sabbath'] },
    ],
  },
  {
    name: 'Beats & pop',
    hue: 320,
    genres: [
      { name: 'Jazz', seeds: ['Miles Davis', 'John Coltrane'] },
      { name: 'Jazz hop', seeds: ['Nujabes', 'J Dilla'] },
      { name: 'Boom bap', seeds: ['A Tribe Called Quest', 'Nas'] },
      { name: 'Trap', seeds: ['Travis Scott', 'Future'] },
      { name: 'Pop', seeds: ['Dua Lipa', 'Taylor Swift'] },
      { name: 'K-pop', seeds: ['BTS', 'NewJeans'] },
      { name: 'Latin pop', seeds: ['Shakira', 'Karol G'] },
      { name: 'Reggaeton', seeds: ['Bad Bunny', 'Daddy Yankee'] },
    ],
  },
]

export interface Star {
  id: string
  name: string
  seeds: string[]
  arm: number
  /** Position along the arm, 0 at the centre. */
  step: number
  hue: number
  x: number
  y: number
}

/** Four logarithmic-ish spiral arms; returns each genre's star with a position in roughly -1..1. */
export function stars(): Star[] {
  return ARMS.flatMap((arm, a) =>
    arm.genres.map((g, i) => {
      const t = (i + 1) / (arm.genres.length + 1)
      const angle = (a * Math.PI) / 2 + t * Math.PI * 1.35
      const r = 0.18 + t * 0.8
      return {
        id: g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: g.name,
        seeds: g.seeds,
        arm: a,
        step: i,
        hue: arm.hue,
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      }
    }),
  )
}

/**
 * The star an arrow key moves to: left and right walk along the arm, up and down jump to the closest
 * star on the next or previous arm.
 */
export function neighbour(
  all: Star[],
  from: Star,
  key: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown',
) {
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    const step = from.step + (key === 'ArrowRight' ? 1 : -1)
    return all.find((s) => s.arm === from.arm && s.step === step) ?? from
  }
  const arm = (from.arm + (key === 'ArrowDown' ? 1 : ARMS.length - 1)) % ARMS.length
  const onArm = all.filter((s) => s.arm === arm)
  return (
    onArm.sort(
      (p, q) => Math.hypot(p.x - from.x, p.y - from.y) - Math.hypot(q.x - from.x, q.y - from.y),
    )[0] ?? from
  )
}
