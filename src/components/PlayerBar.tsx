import { useReducedMotionSafe } from '@/lib/boot'
import { cn } from '@/lib/cn'
import { frequencies, startEngine } from '@/player/engine'
import { currentTrack, usePlayer } from '@/player/store'
import { Link, useLocation } from '@tanstack/react-router'
import { Maximize2, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { AppleMusicBadge, ItunesCredit } from './AppleMusic'
import { Artwork } from './Artwork'

/** A few live bars from the analyser, mint on the bar. Still with reduced motion. */
function Waveform({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotionSafe()
  useEffect(() => {
    const canvas = ref.current
    const g = canvas?.getContext('2d')
    if (!canvas || !g || !active || reduce) return
    const buf = new Uint8Array(64)
    const color = getComputedStyle(canvas).color
    let raf = 0
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const f = frequencies(buf)
      g.clearRect(0, 0, canvas.width, canvas.height)
      g.fillStyle = color
      const bars = 16
      for (let i = 0; i < bars; i++) {
        const v = f ? (f[i * 2 + 1] ?? 0) / 255 : 0
        const h = Math.max(2, v * canvas.height)
        g.fillRect(i * 4, (canvas.height - h) / 2, 2, h)
      }
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [active, reduce])
  return (
    <canvas
      ref={ref}
      width={64}
      height={24}
      className="text-live hidden h-6 w-16 md:block"
      aria-hidden
    />
  )
}

export function PlayerBar() {
  const track = usePlayer(currentTrack)
  const { playing, progress, error, toggle, next, prev, index, queue } = usePlayer()
  // Now playing shows its own big badge; Apple asks for one badge per page.
  const badge = useLocation({ select: (l) => l.pathname !== '/app/now-playing' })

  useEffect(startEngine, [])
  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  if (!track) return null
  return (
    <section
      aria-label="Player"
      className="border-line bg-surface/95 sticky bottom-0 z-30 border-t backdrop-blur-md"
    >
      <div
        className="bg-line h-0.5"
        role="progressbar"
        aria-label="Preview progress"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="bg-live h-full transition-[width] duration-300"
          style={{ width: `${String(progress * 100)}%` }}
        />
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 sm:px-5">
        <Link
          to="/app/now-playing"
          className="group relative shrink-0"
          aria-label="Open now playing"
        >
          <Artwork src={track.artwork} size={100} className="size-11 rounded-md" />
          <Maximize2
            className="absolute inset-0 m-auto size-4 text-white opacity-0 drop-shadow group-hover:opacity-100"
            aria-hidden
          />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" aria-live="polite">
            {track.title}
          </p>
          <p className="text-muted truncate text-xs">{track.artist}</p>
        </div>
        <Waveform active={playing} />
        <div className="flex items-center">
          <button
            type="button"
            onClick={prev}
            disabled={index === 0}
            aria-label="Previous"
            className="text-muted hover:text-text grid size-9 place-items-center rounded-full disabled:opacity-40 [&_svg]:size-4"
          >
            <SkipBack />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? 'Pause' : 'Play'}
            className={cn(
              'bg-accent text-accent-ink grid size-10 place-items-center rounded-full [&_svg]:size-4',
            )}
          >
            {playing ? <Pause /> : <Play />}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={index + 1 >= queue.length}
            aria-label="Next"
            className="text-muted hover:text-text grid size-9 place-items-center rounded-full disabled:opacity-40 [&_svg]:size-4"
          >
            <SkipForward />
          </button>
        </div>
        <div className="hidden flex-col items-end gap-0.5 sm:flex">
          {badge && <AppleMusicBadge url={track.url} />}
          <ItunesCredit className="text-[9px]" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 pb-2 sm:hidden">
        <ItunesCredit className="text-[9px]" />
        {badge && <AppleMusicBadge url={track.url} />}
      </div>
    </section>
  )
}
