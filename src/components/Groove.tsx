import { currentTrack, usePlayer } from '@/player/store'

/**
 * The playlist drawn as one record groove: a slow spiral with a point per song and the needle on the one
 * playing. Decorative; the track list next to it carries the same information.
 */
export function Groove({ ids }: { ids: number[] }) {
  const playingId = usePlayer((s) => currentTrack(s)?.id)
  const n = Math.max(ids.length, 1)
  const point = (i: number) => {
    const t = i / Math.max(n - 1, 1)
    const angle = -Math.PI / 2 + t * Math.PI * 3.2
    const r = 92 - t * 62
    return { x: 100 + Math.cos(angle) * r, y: 100 + Math.sin(angle) * r }
  }
  const path = Array.from({ length: 80 }, (_, k) => point((k / 79) * (n - 1)))
    .map((p, k) => `${k ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')
  return (
    <svg viewBox="0 0 200 200" className="grooves w-full rounded-full" aria-hidden>
      <circle cx="100" cy="100" r="99" fill="none" stroke="var(--line)" />
      <path d={path} fill="none" stroke="var(--line)" strokeWidth="1.5" />
      {ids.map((id, i) => {
        const p = point(i)
        const on = id === playingId
        return (
          <g key={id}>
            {on && <circle cx={p.x} cy={p.y} r="9" fill="var(--live)" opacity="0.25" />}
            <circle
              cx={p.x}
              cy={p.y}
              r={on ? 4.5 : 3}
              fill={on ? 'var(--live)' : 'var(--accent-text)'}
            />
          </g>
        )
      })}
      <circle cx="100" cy="100" r="16" fill="var(--accent)" />
      <circle cx="100" cy="100" r="2.5" fill="var(--bg)" />
    </svg>
  )
}
