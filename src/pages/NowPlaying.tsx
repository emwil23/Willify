import { AppleMusicBadge, ItunesCredit } from '@/components/AppleMusic'
import { Artwork } from '@/components/Artwork'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { useReducedMotionSafe } from '@/lib/boot'
import { cn } from '@/lib/cn'
import { Quiet, useCan3D } from '@/lib/use3d'
import { currentTrack, usePlayer } from '@/player/store'
import { Link } from '@tanstack/react-router'
import { ListMusic, Sparkles } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'

const Visualiser = lazy(() => import('@/components/Visualiser'))

/**
 * Full-screen now playing. The title, the Apple Music badge and the iTunes credit stay on screen the whole
 * time: Apple allows previews only next to a link to the music. Reduced motion shows the artwork still.
 */
export function NowPlaying() {
  const track = usePlayer(currentTrack)
  const { queue, index, playQueue } = usePlayer()
  const reduce = useReducedMotionSafe()
  const can3D = useCan3D(reduce, false)
  const [showQueue, setShowQueue] = useState(false)

  if (!track)
    return (
      <EmptyState
        art="/media/empty-playlist"
        title="Nothing playing"
        action={
          <Button asChild variant="primary">
            <Link to="/app">
              <Sparkles /> Ask the DJ
            </Link>
          </Button>
        }
      >
        Play a preview anywhere in Willify and it shows up here, with a visualiser that moves to it.
      </EmptyState>
    )

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#09080f] px-4 py-10 text-white">
      <div className="relative grid aspect-square w-full max-w-[min(90vw,620px)] place-items-center">
        {can3D && (
          <div className="absolute inset-0" aria-hidden>
            <Quiet>
              <Suspense fallback={null}>
                <Visualiser color="#8f72ff" />
              </Suspense>
            </Quiet>
          </div>
        )}
        <div
          className={cn(
            'relative w-[52%] overflow-hidden rounded-full shadow-2xl',
            !can3D && 'grooves',
          )}
        >
          <Artwork
            src={track.artwork}
            size={600}
            eager
            alt={`Artwork for ${track.album ?? track.title}`}
            className="aspect-square w-full"
          />
          <span
            className="absolute inset-0 m-auto size-[14%] rounded-full bg-[#09080f] ring-4 ring-white/10"
            aria-hidden
          />
        </div>
      </div>
      <div className="relative mt-6 text-center">
        <h1 className="font-display text-3xl font-bold [font-stretch:85%] sm:text-5xl">
          {track.title}
        </h1>
        <p className="mt-1 text-white/70">{track.artist}</p>
        {track.why && <p className="mt-2 text-sm text-[#a48cff]">{track.why}</p>}
        <div className="mt-5 flex flex-col items-center gap-2">
          <AppleMusicBadge url={track.url} />
          <ItunesCredit className="text-white/60" />
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="mt-4 text-white/70 hover:text-white"
          aria-expanded={showQueue}
          onClick={() => setShowQueue((v) => !v)}
        >
          <ListMusic /> Up next ({Math.max(0, queue.length - index - 1)})
        </Button>
      </div>
      {showQueue && (
        <ol aria-label="Up next" className="relative mt-4 w-full max-w-md space-y-1">
          {queue.map((t, i) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => playQueue(queue, i)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/10',
                  i === index && 'text-[#6cf2c2]',
                )}
              >
                <span className="spec w-5 text-white/50">{i + 1}</span>
                <span className="truncate">
                  {t.title} <span className="text-white/60">· {t.artist}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
