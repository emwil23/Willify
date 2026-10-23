import { cn } from '@/lib/cn'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Check, Copy, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

gsap.registerPlugin(ScrollTrigger)

// Demo songs for the story only: drawn as text, never played, never presented as album art.
const DEMO = [
  { artist: 'Nujabes', title: 'Aruarian Dance', why: 'Dusty jazz chords that keep you typing' },
  { artist: 'Bonobo', title: 'Kiara', why: 'A slow build for the long function' },
  { artist: 'Khruangbin', title: 'August 10', why: 'Warm guitar, no words to distract' },
  { artist: 'Tom Misch', title: 'Movie', why: 'Sunny enough to beat the rain' },
]

const BEATS = [
  {
    key: 'describe',
    n: '01',
    title: 'Describe',
    body: 'A sentence is enough: a place, a mood, a moment. “Rainy Sunday coding, lo-fi but not sleepy.” No genres to pick, no account to make.',
  },
  {
    key: 'listen',
    n: '02',
    title: 'Listen',
    body: 'The DJ suggests songs, and Willify checks every one against the iTunes catalogue. Made-up tracks are dropped. Real ones drop onto the groove and the previews start at once.',
  },
  {
    key: 'refine',
    n: '03',
    title: 'Refine',
    body: '“More energy.” “Less vocals.” “More like #3.” Thumbs up and down steer the next pick, and the groove bends to fit.',
  },
  {
    key: 'share',
    n: '04',
    title: 'Share',
    body: 'Save it to your library, copy it as text, or export a CSV with an Apple Music link for every song.',
  },
] as const

function Demo({ beat }: { beat: number }) {
  return (
    <div className="border-line bg-surface shadow-card relative w-full overflow-hidden rounded-3xl border p-6">
      <p className="spec text-muted">Vibe</p>
      <p className="font-display mt-1 text-2xl">
        Rainy Sunday coding, lo-fi but not sleepy
        {beat === 0 && (
          <span
            className="bg-accent ml-1 inline-block h-6 w-0.5 animate-pulse align-middle"
            aria-hidden
          />
        )}
      </p>
      <ol className="mt-5 space-y-2">
        {DEMO.map((d, i) => (
          <li
            key={d.title}
            className={cn(
              'border-line flex items-center gap-3 rounded-xl border px-3 py-2 transition-all duration-500',
              beat === 0 ? 'translate-y-3 opacity-0' : 'translate-y-0 opacity-100',
              beat === 2 && i === 1 && 'opacity-40',
            )}
            style={{ transitionDelay: `${String(i * 80)}ms` }}
          >
            <span className="grooves bg-surface-2 size-9 shrink-0 rounded-md" aria-hidden />
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block truncate text-sm font-medium',
                  beat >= 1 && i === 0 && 'text-live',
                )}
              >
                {d.title}
              </span>
              <span className="text-muted block truncate text-xs">
                {d.artist} · <span className="text-accent-text">{d.why}</span>
              </span>
            </span>
            {beat >= 2 && (
              <span className="flex gap-1 [&_svg]:size-3.5">
                <ThumbsUp className={cn(i === 0 ? 'text-live' : 'text-muted')} aria-hidden />
                <ThumbsDown className={cn(i === 1 ? 'text-danger' : 'text-muted')} aria-hidden />
              </span>
            )}
          </li>
        ))}
      </ol>
      <div
        className={cn(
          'mt-4 flex flex-wrap gap-2 transition-opacity duration-500',
          beat === 2 ? 'opacity-100' : 'opacity-0',
        )}
      >
        {['More energy', 'Less vocals', 'More like #1'].map((c) => (
          <span
            key={c}
            className="border-accent-text/50 text-accent-text rounded-full border px-3 py-1 text-xs"
          >
            {c}
          </span>
        ))}
      </div>
      <div
        className={cn(
          'bg-surface/95 absolute inset-x-6 bottom-6 flex items-center gap-3 rounded-2xl border border-[var(--line)] p-4 backdrop-blur transition-all duration-500',
          beat === 3 ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        )}
      >
        <Check className="text-live size-5" aria-hidden />
        <span className="flex-1 text-sm">Copied 12 songs as text</span>
        <Copy className="text-muted size-4" aria-hidden />
      </div>
    </div>
  )
}

/**
 * The four-beat scroll story. On big screens the demo stays put while the copy scrolls and each beat moves
 * it on; with reduced motion (and on phones) it is a plain list with the finished demo.
 */
export function Story({ animate }: { animate: boolean }) {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(animate ? 0 : 3)

  useEffect(() => {
    if (!animate || !root.current) return
    const ctx = gsap.context(() => {
      root.current?.querySelectorAll('[data-beat]').forEach((el, i) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => self.isActive && setActive(i),
        })
      })
      gsap.from('[data-groove-line]', {
        scaleX: 0,
        transformOrigin: 'left',
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top 70%',
          end: 'bottom bottom',
          scrub: true,
        },
      })
    }, root)
    return () => ctx.revert()
  }, [animate])

  return (
    <section ref={root} id="how" aria-labelledby="how-h" className="relative scroll-mt-20 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <p className="spec text-accent-text">How it works</p>
        <h2
          id="how-h"
          className="font-display mt-3 max-w-3xl text-5xl leading-[0.95] font-bold [font-stretch:80%] md:text-7xl"
        >
          From a sentence to a soundtrack in four moves.
        </h2>
        <div
          data-groove-line
          className="from-accent via-live mt-10 h-px w-full bg-gradient-to-r to-transparent"
          aria-hidden
        />
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl gap-10 px-6 md:grid-cols-[1fr_1.1fr]">
        <ol className="flex flex-col">
          {BEATS.map((b, i) => (
            <li
              key={b.key}
              data-beat
              className={cn(
                'border-line flex min-h-[50vh] flex-col justify-center border-t py-10 transition-opacity duration-500 md:min-h-[70vh]',
                animate && active !== i && 'md:opacity-35',
              )}
            >
              <p className="spec text-muted">{b.n} / 04 · side A</p>
              <h3 className="font-display mt-2 text-5xl font-bold [font-stretch:80%] md:text-6xl">
                {b.title}
              </h3>
              <p className="text-muted mt-4 max-w-md text-lg">{b.body}</p>
            </li>
          ))}
        </ol>
        <div className="sticky top-24 hidden h-[70vh] items-center md:flex" aria-hidden>
          <Demo beat={active} />
        </div>
      </div>
    </section>
  )
}
