import { cn } from '@/lib/cn'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef, type CSSProperties } from 'react'

gsap.registerPlugin(ScrollTrigger)

const TRACKS = [
  {
    n: 'A1',
    title: 'Describe',
    body: 'One sentence: a place, a mood, a moment. No genres to pick, no account to make.',
    // Each sleeve gets its own op-art cover, drawn in CSS: no fake album art.
    cover:
      'repeating-radial-gradient(circle at 30% 70%, var(--accent) 0 6px, transparent 6px 18px), var(--surface)',
  },
  {
    n: 'A2',
    title: 'Listen',
    body: 'The DJ suggests songs; every one is checked against the iTunes catalogue. Previews start at once.',
    cover:
      'repeating-linear-gradient(90deg, var(--text) 0 4px, transparent 4px 14px), linear-gradient(var(--live), var(--live))',
  },
  {
    n: 'A3',
    title: 'Refine',
    body: '“More energy.” “Less vocals.” “More like #3.” Thumbs up and down steer the next round.',
    cover: 'repeating-linear-gradient(-35deg, var(--accent) 0 10px, var(--surface) 10px 22px)',
  },
  {
    n: 'A4',
    title: 'Share',
    body: 'Save it to your library, copy it as text, or export a CSV with an Apple Music link for every song.',
    cover:
      'radial-gradient(circle, var(--text) 3px, transparent 3.5px) 0 0 / 22px 22px, var(--live)',
  },
] as const

function Sleeve({ t, i }: { t: (typeof TRACKS)[number]; i: number }) {
  return (
    <li data-sleeve className="w-[min(78vw,26rem)] shrink-0 md:w-[min(34vw,50vh,30rem)]">
      <div className="relative aspect-square">
        {/* The record, tucked behind the sleeve until its turn. */}
        <div
          data-vinyl
          className="vinyl absolute inset-[4%] rounded-full"
          style={{ '--label': i % 2 ? 'var(--live)' : 'var(--accent)' } as CSSProperties}
          aria-hidden
        />
        <div
          className="shadow-card border-line relative flex size-full flex-col justify-between overflow-hidden rounded-md border p-5"
          style={{ background: t.cover }}
        >
          <span className="font-display bg-bg/85 self-start rounded px-2 py-1 text-5xl leading-none font-extrabold [font-stretch:75%]">
            {t.n}
          </span>
          <span className="spec bg-bg/85 self-start rounded px-2 py-1">Willify · side A</span>
        </div>
      </div>
      <h3 className="font-display mt-6 text-5xl font-extrabold tracking-tight [font-stretch:80%]">
        {t.title}
      </h3>
      <p className="text-muted mt-3 max-w-sm text-lg">{t.body}</p>
    </li>
  )
}

/**
 * How it works, as a record's side A. Wide screens: the section pins and the sleeves travel left with the
 * scroll, each vinyl sliding out as its sleeve passes the middle. Phones: a stack where each record slides
 * out as it comes into view. Reduced motion: the records sit half out, nothing moves.
 */
export function SideA({ animate }: { animate: boolean }) {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const el = root.current
    const list = track.current
    if (!el || !list || !animate) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 768px)', () => {
      const distance = () => list.scrollWidth - window.innerWidth + 80
      const tween = gsap.to(list, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: () => `+=${String(distance())}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      })
      list.querySelectorAll<HTMLElement>('[data-sleeve]').forEach((s) => {
        const vinyl = s.querySelector('[data-vinyl]')
        if (!vinyl) return
        gsap.fromTo(
          vinyl,
          { xPercent: 0, rotate: -40 },
          {
            xPercent: 52,
            rotate: 160,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: s,
              containerAnimation: tween,
              start: 'left 75%',
              end: 'left 35%',
              scrub: true,
            },
          },
        )
      })
    })
    mm.add('(max-width: 767px)', () => {
      list.querySelectorAll<HTMLElement>('[data-vinyl]').forEach((v) => {
        gsap.fromTo(
          v,
          { xPercent: 0, rotate: -40 },
          {
            xPercent: 30,
            rotate: 120,
            ease: 'power2.out',
            scrollTrigger: { trigger: v, start: 'top 80%', end: 'top 40%', scrub: true },
          },
        )
      })
    })
    return () => mm.revert()
  }, [animate])

  return (
    <section
      ref={root}
      id="how"
      aria-labelledby="how-h"
      className="relative scroll-mt-20 overflow-hidden py-24 md:flex md:min-h-dvh md:flex-col md:justify-center md:py-16"
    >
      <div className="mx-auto mb-10 flex w-full max-w-7xl items-end justify-between gap-6 px-6 sm:px-10">
        <h2
          id="how-h"
          className="font-display text-[clamp(3rem,8vw,7.5rem)] leading-[0.85] font-extrabold tracking-tight [font-stretch:75%]"
        >
          Side A.
          <span className="text-muted block text-[0.42em] font-semibold [font-stretch:90%]">
            Four tracks, one sentence in.
          </span>
        </h2>
        <span className="spec text-muted hidden md:block">How it works · scroll →</span>
      </div>
      <ol
        ref={track}
        aria-label="How it works"
        className={cn(
          'flex flex-col gap-20 px-6 sm:px-10 md:w-max md:flex-row md:gap-[8vw] md:pr-[20vw]',
          !animate && '[&_[data-vinyl]]:translate-x-[30%]',
        )}
      >
        {TRACKS.map((t, i) => (
          <Sleeve key={t.n} t={t} i={i} />
        ))}
      </ol>
    </section>
  )
}
