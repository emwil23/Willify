import { describe, expect, it } from 'vitest'
import { neighbour, stars, type Star } from './galaxy'

describe('galaxy', () => {
  const all = stars()
  const named = (name: string) => all.find((s) => s.name === name) as Star

  it('places every genre once, inside the disc', () => {
    expect(new Set(all.map((s) => s.id)).size).toBe(all.length)
    expect(all.every((s) => Math.hypot(s.x, s.y) <= 1)).toBe(true)
  })

  it('walks along an arm with left/right and stops at its ends', () => {
    const first = named('Gospel')
    expect(neighbour(all, first, 'ArrowRight').name).toBe('Blues')
    expect(neighbour(all, first, 'ArrowLeft')).toBe(first)
  })

  it('jumps to the nearest star on another arm with up/down, wrapping round', () => {
    const jazz = named('Jazz')
    expect(neighbour(all, jazz, 'ArrowDown').arm).toBe(0)
    expect(neighbour(all, named('Gospel'), 'ArrowUp').arm).toBe(3)
  })
})
