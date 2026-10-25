import { ARMS } from '@/lib/galaxy'
import { Link } from '@tanstack/react-router'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight } from 'lucide-react'
import { useEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

const RINGS = [176, 146, 116, 86]
const TEXT_SCALE = 4

/** Mono text sized so a ring's genres fill its circumference once (a mono glyph is about 0.6em wide). */
function ringText(names: string[], r: number) {
  const text = `${names.map((n) => n.toUpperCase()).join(' · ')} · `
  const spacing = 1.2
  const size = ((2 * Math.PI * r * 0.97) / text.length - spacing) / 0.6
  return { text, size: Math.min(10, size), spacing }
}

/**
 * The genre galaxy as a record: each spiral arm becomes a groove, its genres set along a circular path.
 * The record turns with the scroll and spins faster the faster you scroll. Decorative; the link carries it.
 */
export function RecordSpin({ animate }: { animate: boolean }) {
  const root = useRef<HTMLElement>(null)
  const disc = useRef<SVGGElement>(null)

  useEffect(() => {
    const el = root.current
    const g = disc.current
    if (!el || !g || !animate) return
    const spin = { deg: 0, extra: 0 }
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        spin.deg = self.progress * 300
        // A flick of the wheel gives the record a push that eases off.
        spin.extra += Math.max(-30, Math.min(30, self.getVelocity() / 150))
      },
    })
    const tick = () => {
      spin.extra *= 0.94
      g.style.transform = `rotate(${String(spin.deg + spin.extra)}deg)`
    }
    gsap.ticker.add(tick)
    return () => {
      st.kill()
      gsap.ticker.remove(tick)
    }
  }, [animate])

  return (
    <section ref={root} aria-labelledby="spin-h" className="relative overflow-hidden py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 sm:px-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="spec text-accent-text">B2 · The genre galaxy</p>
          <h2
            id="spin-h"
            className="font-display mt-4 text-[clamp(2.8rem,7vw,6.5rem)] leading-[0.88] font-extrabold tracking-tight [font-stretch:78%]"
          >
            Forty genres. Four grooves.
          </h2>
          <p className="text-muted mt-6 max-w-md text-lg">
            Soul, electronic, guitars, beats: each family is one groove, neighbours sound alike. In
            the app it opens up into a 3D galaxy you can fly through; tap a star and hear it.
          </p>
          <Link
            to="/app/galaxy"
            className="group border-text hover:bg-text hover:text-bg mt-8 inline-flex items-center gap-3 rounded-full border px-6 py-3 font-medium transition-colors"
          >
            Explore the galaxy
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
        <svg viewBox="-200 -200 400 400" className="mx-auto w-full max-w-[640px]" aria-hidden>
          <circle r="198" fill="#0c0b10" />
          <circle r="198" fill="url(#spin-grooves)" />
          <defs>
            <radialGradient id="spin-sheen" cx="30%" cy="25%" r="80%">
              <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <pattern
              id="spin-grooves"
              width="400"
              height="400"
              x="-200"
              y="-200"
              patternUnits="userSpaceOnUse"
            >
              {Array.from({ length: 46 }, (_, i) => (
                <circle
                  key={i}
                  cx="200"
                  cy="200"
                  r={60 + i * 3}
                  fill="none"
                  stroke="#24212c"
                  strokeWidth="0.6"
                />
              ))}
            </pattern>
            {RINGS.map((r, i) => {
              const R = r * TEXT_SCALE
              return (
                <path
                  key={r}
                  id={`spin-ring-${String(i)}`}
                  d={`M 0 ${String(-R)} a ${String(R)} ${String(R)} 0 1 1 0 ${String(2 * R)} a ${String(R)} ${String(R)} 0 1 1 0 ${String(-2 * R)}`}
                />
              )
            })}
          </defs>
          <g ref={disc} style={{ transformOrigin: '0 0' }}>
            {/* Text is set at 4x and drawn at a quarter, so its computed size stays legible for audits. */}
            <g
              transform={`scale(${String(1 / TEXT_SCALE)})`}
              fontFamily="JetBrains Mono, ui-monospace, monospace"
            >
              {ARMS.map((arm, i) => {
                const ring = ringText(
                  arm.genres.map((g) => g.name),
                  RINGS[i] ?? 86,
                )
                return (
                  <text
                    key={arm.name}
                    fontSize={ring.size * TEXT_SCALE}
                    letterSpacing={ring.spacing * TEXT_SCALE}
                    fill={`hsl(${String(arm.hue)} 85% 76%)`}
                  >
                    <textPath href={`#spin-ring-${String(i)}`}>{ring.text}</textPath>
                  </text>
                )
              })}
            </g>
            <circle r="52" fill="var(--accent)" />
            <g transform={`scale(${String(1 / TEXT_SCALE)})`}>
              <text
                y={-8 * TEXT_SCALE}
                textAnchor="middle"
                fontSize={13 * TEXT_SCALE}
                fontWeight="800"
                fill="var(--accent-ink)"
                className="font-display"
              >
                WILLIFY
              </text>
              <text
                y={10 * TEXT_SCALE}
                textAnchor="middle"
                fontSize={6.5 * TEXT_SCALE}
                letterSpacing={1.5 * TEXT_SCALE}
                fill="var(--accent-ink)"
                fontFamily="JetBrains Mono, ui-monospace, monospace"
              >
                40 GENRES · SIDE B
              </text>
            </g>
            <circle r="4" fill="#0c0b10" />
          </g>
          <circle r="198" fill="url(#spin-sheen)" />
        </svg>
      </div>
    </section>
  )
}
