import { cn } from '@/lib/cn'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Check, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger, SplitText)

// A real run: Gemini's answer to "Rainy Sunday coding, lo-fi but not sleepy", checked against iTunes by
// src/lib/match.ts (scripts/screenshot-fixtures.json). Two of its songs don't exist.
const CHECKED = [
  { artist: 'Tycho', title: 'A Walk', real: true },
  { artist: 'Boards of Canada', title: 'Dayvan Cowboy', real: true },
  { artist: 'Loscil', title: 'Sea Island', real: false },
  { artist: 'Nujabes', title: 'Feather', real: true },
  { artist: 'Caribou', title: 'Odessa', real: true },
  { artist: 'Bibio', title: 'Take Off Your Jacket', real: false },
  { artist: 'Khruangbin', title: 'White Gloves', real: true },
  { artist: 'Burial', title: 'Archangel', real: true },
] as const

/**
 * The one thing other AI DJs don't do. The statement lights up word by word with the scroll, and the
 * list is checked line by line: a mint stamp for songs on iTunes, a red strike through the made-up ones.
 */
export function RealOnly({ animate }: { animate: boolean }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || !animate) return
    const ctx = gsap.context(() => {
      const split = SplitText.create('[data-statement]', { type: 'words' })
      gsap.fromTo(
        split.words,
        // Muted to full ink: a dramatic reveal that still passes AA contrast at every step.
        { color: 'var(--muted)' },
        {
          color: 'var(--text)',
          stagger: 0.1,
          ease: 'none',
          scrollTrigger: {
            trigger: '[data-statement]',
            start: 'top 80%',
            end: 'bottom 45%',
            scrub: true,
          },
        },
      )
      el.querySelectorAll<HTMLElement>('[data-row]').forEach((row) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: row,
            start: 'top 82%',
            toggleActions: 'play none none reverse',
          },
        })
        tl.from(row.querySelector('[data-song]'), {
          opacity: 0,
          x: -24,
          duration: 0.5,
          ease: 'power3.out',
        })
        const strike = row.querySelector('[data-strike]')
        if (strike) tl.from(strike, { scaleX: 0, duration: 0.45, ease: 'power2.inOut' }, '-=0.1')
        tl.from(
          row.querySelector('[data-stamp]'),
          { opacity: 0, scale: 1.6, rotate: -12, duration: 0.4, ease: 'back.out(2)' },
          '-=0.2',
        )
      })
      return () => split.revert()
    }, el)
    return () => ctx.revert()
  }, [animate])

  return (
    <section
      ref={root}
      aria-labelledby="real-h"
      className="mx-auto grid max-w-7xl gap-14 px-6 py-28 sm:px-10 lg:grid-cols-[1.05fr_1fr] lg:gap-20"
    >
      <div className="lg:sticky lg:top-28 lg:self-start">
        <p className="spec text-accent-text">B1 · Real songs only</p>
        <h2
          id="real-h"
          data-statement
          className="font-display mt-4 text-[clamp(2.6rem,6vw,5.6rem)] leading-[0.92] font-extrabold tracking-tight [font-stretch:80%]"
        >
          AI makes songs up. Willify checks every one before you hear it.
        </h2>
        <p className="text-muted mt-6 max-w-md text-lg">
          This is a real answer from the AI, run through the same check the app uses. Six songs are
          real, on iTunes and ready to play. Two don't exist. You never see those.
        </p>
      </div>
      <ol aria-label="AI suggestions, checked against iTunes" className="border-line border-t">
        {CHECKED.map((s) => (
          <li
            key={s.title}
            data-row
            className="border-line relative flex items-center gap-4 border-b py-5"
          >
            <div data-song className="relative min-w-0 flex-1">
              <p
                className={cn(
                  'font-display truncate text-2xl font-semibold sm:text-3xl',
                  !s.real && 'text-muted',
                )}
              >
                {s.title}
              </p>
              <p className="text-muted truncate text-sm">{s.artist}</p>
              {!s.real && (
                <span
                  data-strike
                  className="bg-danger absolute top-[38%] left-0 h-0.5 w-full origin-left"
                  aria-hidden
                />
              )}
            </div>
            <span
              data-stamp
              className={cn(
                'spec flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5',
                s.real ? 'border-live text-live' : 'border-danger text-danger',
              )}
            >
              {s.real ? (
                <Check className="size-3.5" aria-hidden />
              ) : (
                <X className="size-3.5" aria-hidden />
              )}
              {s.real ? 'On iTunes' : 'Made up · dropped'}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
