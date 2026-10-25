import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

const DOORS = [
  { key: 'dj', to: '/app', label: 'Vibe DJ', note: 'Describe it, hear it, refine it' },
  { key: 'galaxy', to: '/app/galaxy', label: 'Galaxy', note: 'Fly between forty genres in 3D' },
  {
    key: 'library',
    to: '/app/library',
    label: 'Library',
    note: 'Playlists as sleeves, your week in music',
  },
  {
    key: 'quiz',
    to: '/app/quiz',
    label: 'Name that song',
    note: 'A daily clue quiz from the charts',
  },
] as const

const wide = () => matchMedia('(pointer: fine) and (min-width: 768px)')
/** A mouse on a wide screen. False while hydrating, like the prerendered HTML, then the real value. */
const useFinePointer = () =>
  useSyncExternalStore(
    (onChange) => {
      const q = wide()
      q.addEventListener('change', onChange)
      return () => q.removeEventListener('change', onChange)
    },
    () => wide().matches,
    () => false,
  )

/**
 * The modes as one tall list of doors. On wide screens with a mouse, the mode's artwork floats beside the
 * pointer while you hover a row; on phones each row carries its thumbnail.
 */
export function Doors({ animate }: { animate: boolean }) {
  const [hover, setHover] = useState<string | null>(null)
  const float = useRef<HTMLDivElement>(null)
  const fine = useFinePointer() && animate

  useEffect(() => {
    const el = float.current
    if (!el || !fine) return
    let x = 0
    let y = 0
    let tx = 0
    let ty = 0
    let raf = 0
    const onMove = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
    }
    const loop = () => {
      raf = requestAnimationFrame(loop)
      x += (tx - x) * 0.14
      y += (ty - y) * 0.14
      el.style.transform = `translate(${String(x + 28)}px, ${String(y - 120)}px) rotate(${String((tx - x) * 0.04)}deg)`
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [fine])

  return (
    <section aria-labelledby="doors-h" className="mx-auto max-w-7xl px-6 py-28 sm:px-10">
      <div className="flex items-end justify-between gap-6">
        <h2 id="doors-h" className="spec text-accent-text">
          B3 · Four ways in
        </h2>
        <span className="spec text-muted">(04)</span>
      </div>
      <ul className="border-text/80 mt-6 border-t" onPointerLeave={() => setHover(null)}>
        {DOORS.map((d, i) => (
          <li key={d.key} className="border-text/80 border-b">
            <Link
              to={d.to}
              onPointerEnter={() => setHover(d.key)}
              onFocus={() => setHover(d.key)}
              onBlur={() => setHover(null)}
              className="group flex items-center gap-4 py-5 sm:gap-8 sm:py-7"
            >
              <span className="spec text-muted w-8 shrink-0">0{i + 1}</span>
              <img
                src={`/media/mode-${d.key}.webp`}
                alt=""
                width={64}
                height={64}
                loading="lazy"
                className="size-14 shrink-0 rounded-md object-cover md:hidden"
              />
              <span className="font-display group-hover:text-accent-text min-w-0 flex-1 text-[clamp(2.2rem,8vw,7rem)] leading-[0.9] font-extrabold tracking-tight uppercase [font-stretch:75%] transition-[font-stretch,color] duration-500 group-hover:[font-stretch:100%]">
                {d.label}
              </span>
              <span className="text-muted hidden max-w-[14rem] text-right text-sm lg:block">
                {d.note}
              </span>
              <ArrowUpRight
                className="size-7 shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 sm:size-10"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
      {fine && (
        <div
          ref={float}
          className="pointer-events-none fixed top-0 left-0 z-30 hidden md:block"
          style={{ opacity: hover ? 1 : 0, transition: 'opacity .3s' }}
          aria-hidden
        >
          {DOORS.map((d) => (
            <img
              key={d.key}
              src={`/media/mode-${d.key}.webp`}
              alt=""
              width={240}
              height={240}
              loading="lazy"
              className="shadow-card absolute top-0 left-0 size-60 rounded-lg object-cover transition-[opacity,scale] duration-300"
              style={{ opacity: hover === d.key ? 1 : 0, scale: hover === d.key ? '1' : '0.9' }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
