import { cn } from '@/lib/cn'
import { Quiet, useCan3D } from '@/lib/use3d'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { ListenToggle } from './ListenToggle'

const GrooveField = lazy(() => import('./GrooveField'))

export const VIBES = [
  'a rainy Sunday, lo-fi but not sleepy',
  'a golden hour drive along the coast',
  'cooking with friends, 70s soul',
  'a late train through a neon city',
  'the first run of spring',
  'reading in a café, soft bossa nova',
]

/** Example vibes typing themselves into the empty field, one letter at a time. */
function useTypedPlaceholder(active: boolean) {
  const [text, setText] = useState(VIBES[0] ?? '')
  useEffect(() => {
    if (!active) return
    let i = 0
    let n = 0
    let deleting = false
    let id = 0
    const tick = () => {
      const full = VIBES[i % VIBES.length] ?? ''
      n += deleting ? -1 : 1
      setText(full.slice(0, n))
      let wait = deleting ? 28 : 55
      if (!deleting && n >= full.length) {
        deleting = true
        wait = 1800
      } else if (deleting && n <= 0) {
        deleting = false
        i++
        wait = 350
      }
      id = window.setTimeout(tick, wait)
    }
    id = window.setTimeout(tick, 1200)
    return () => window.clearTimeout(id)
  }, [active])
  return text
}

/**
 * The headline leans towards the pointer: letters near it get heavier and narrower on the variable font's
 * weight and width axes. Only style changes, so the prerendered text paints at once and stays readable.
 */
function useKineticType(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const root = ref.current
    if (!root || !active || !matchMedia('(pointer: fine)').matches) return
    const chars = [...root.querySelectorAll<HTMLElement>('[data-char]')]
    let raf = 0
    let px = -1e4
    let py = -1e4
    const paint = () => {
      raf = 0
      for (const c of chars) {
        const r = c.getBoundingClientRect()
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2))
        const k = Math.max(0, 1 - d / 420)
        c.style.fontWeight = String(Math.round(780 - k * 480))
        c.style.fontStretch = `${String(Math.round(78 + k * 22))}%`
      }
    }
    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      if (!raf) raf = requestAnimationFrame(paint)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
      for (const c of chars) c.style.removeProperty('font-weight')
      for (const c of chars) c.style.removeProperty('font-stretch')
    }
  }, [ref, active])
}

const Chars = ({ text }: { text: string }) => (
  <span aria-hidden className="inline-block whitespace-nowrap">
    {Array.from(text).map((ch, i) => (
      <span
        key={i}
        data-char
        className="inline-block transition-[font-weight,font-stretch] duration-300 ease-out"
      >
        {ch === ' ' ? ' ' : ch}
      </span>
    ))}
  </span>
)

/** "Tonight sounds like ___." The blank is the input. Works as a plain GET form before the JS loads. */
export function VibeSentence({
  id,
  compact = false,
  reduce,
}: {
  id: string
  compact?: boolean
  reduce: boolean
}) {
  const navigate = useNavigate()
  // Uncontrolled, so text typed before the app hydrates is kept; only "is there text?" is tracked.
  const [typed, setTyped] = useState(false)
  const placeholder = useTypedPlaceholder(!reduce && !typed)
  const submit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const v = new FormData(e.currentTarget).get('vibe')
    const vibe = typeof v === 'string' ? v.trim() : ''
    if (vibe.length > 1) void navigate({ to: '/app', search: { vibe } })
  }
  return (
    <form action="/app" method="get" onSubmit={submit} className="group relative">
      <div
        className={cn(
          'border-text/80 focus-within:border-accent-text flex items-end gap-3 border-b-2 pb-2 transition-colors',
          compact ? 'max-w-2xl' : 'max-w-4xl',
        )}
      >
        <input
          id={id}
          name="vibe"
          required
          minLength={2}
          maxLength={300}
          autoComplete="off"
          onInput={(e) => setTyped(e.currentTarget.value.length > 0)}
          placeholder={placeholder}
          aria-describedby={`${id}-hint`}
          className={cn(
            'font-display placeholder:text-muted/60 min-w-0 flex-1 bg-transparent leading-tight font-semibold tracking-tight [font-stretch:88%] outline-none',
            compact ? 'text-2xl sm:text-4xl' : 'text-[clamp(1.75rem,4.6vw,4.5rem)]',
          )}
        />
        <button
          type="submit"
          aria-label="Make my playlist"
          className={cn(
            'bg-accent text-accent-ink grid shrink-0 place-items-center rounded-full transition-transform hover:scale-105 active:scale-95',
            compact ? 'size-11' : 'size-12 sm:size-16',
          )}
        >
          <ArrowRight className={compact ? 'size-5' : 'size-6 sm:size-7'} aria-hidden />
        </button>
      </div>
      <p id={`${id}-hint`} className="spec text-muted mt-3">
        Press enter · every song checked on iTunes · no account, no Premium
      </p>
    </form>
  )
}

function CropMarks() {
  const mark = 'border-text/40 absolute size-4'
  return (
    <div className="pointer-events-none absolute inset-4 sm:inset-6" aria-hidden>
      <span className={cn(mark, 'top-0 left-0 border-t border-l')} />
      <span className={cn(mark, 'top-0 right-0 border-t border-r')} />
      <span className={cn(mark, 'bottom-0 left-0 border-b border-l')} />
      <span className={cn(mark, 'right-0 bottom-0 border-r border-b')} />
    </div>
  )
}

export function Hero({ reduce }: { reduce: boolean }) {
  const can3D = useCan3D(reduce, false)
  const h1 = useRef<HTMLHeadingElement>(null)
  useKineticType(h1, !reduce)

  return (
    <section aria-labelledby="hero-h" className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* The static groove pattern is always there (and is all you get with reduced motion); the live
          shader fades in over it once the page is idle. */}
      <div className="groove-static pointer-events-none absolute inset-0" aria-hidden />
      {can3D && (
        <Quiet>
          <Suspense fallback={null}>
            <GrooveField className="absolute inset-0 size-full animate-[fade-in_1.6s_ease-out_both]" />
          </Suspense>
        </Quiet>
      )}
      <div
        className="from-bg via-bg/80 pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r to-transparent md:w-2/3"
        aria-hidden
      />
      <CropMarks />

      <ListenToggle className="absolute top-24 right-6 z-10 sm:right-10" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pt-36 pb-28 sm:px-10">
        {/* The LCP element: plain text from the prerendered HTML; only its axes move. */}
        <h1
          ref={h1}
          id="hero-h"
          aria-label="Tonight sounds like"
          className="font-display text-[clamp(4.6rem,17vw,13.5rem)] leading-[0.82] font-extrabold tracking-[-0.03em] [font-stretch:78%]"
        >
          <Chars text="Tonight" />
          <br />
          <Chars text="sounds like" />
        </h1>
        <div className="mt-8 sm:mt-10">
          <label htmlFor="hero-vibe" className="sr-only">
            Describe the moment
          </label>
          <VibeSentence id="hero-vibe" reduce={reduce} />
        </div>
      </div>

      <div
        className="spec text-muted pointer-events-none absolute right-6 bottom-8 left-6 flex items-end justify-between sm:right-10 sm:left-10"
        aria-hidden
      >
        <span className="flex flex-col gap-1">
          <span>Willify · the AI DJ that only plays real songs</span>
          <span>Side A · 33⅓ rpm · 30s previews</span>
        </span>
        <span className="hidden sm:inline">Scroll to drop the needle ↓</span>
      </div>
    </section>
  )
}
