import { ItunesCredit } from '@/components/AppleMusic'
import { TrackList } from '@/components/TrackRow'
import { Button } from '@/components/ui/button'
import { useReducedMotionSafe } from '@/lib/boot'
import { cn } from '@/lib/cn'
import { ARMS, neighbour, stars, type Star } from '@/lib/galaxy'
import { artistMatches } from '@/lib/match'
import { searchTracks, type Track } from '@/lib/music'
import { Quiet, useCan3D } from '@/lib/use3d'
import { useLoad } from '@/lib/useLoad'
import { usePlayer } from '@/player/store'
import { useSettings } from '@/stores/settings'
import { Link } from '@tanstack/react-router'
import { List, Loader2, Orbit, Play, Sparkles } from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'

const GalaxyScene = lazy(() => import('@/components/GalaxyScene'))

/** Three songs by the genre's defining artists, found on iTunes so every example is real. */
async function examples(star: Star, country: string): Promise<Track[]> {
  const lists = await Promise.all(
    star.seeds.map((a) => searchTracks(a, country, 10).catch(() => [] as Track[])),
  )
  const picks = lists.flatMap((list, i) =>
    list
      .filter((t) => t.previewUrl && artistMatches(star.seeds[i] ?? '', t.artist))
      .slice(0, i === 0 ? 2 : 1),
  )
  return picks.slice(0, 3)
}

const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'] as const

export function Galaxy() {
  const reduce = useReducedMotionSafe()
  const can3D = useCan3D(reduce, false)
  const all = useMemo(() => stars(), [])
  const [view, setView] = useState<'3d' | 'list'>('3d')
  const [selected, setSelected] = useState<Star>(
    () => all.find((s) => s.name === 'Jazz hop') ?? (all[0] as Star),
  )
  const country = useSettings((s) => s.country)
  const { data: tracks, error } = useLoad(() => examples(selected, country), [selected.id, country])
  const show3D = can3D && view === '3d'

  const neighbours = [
    all.find((s) => s.arm === selected.arm && s.step === selected.step - 1),
    all.find((s) => s.arm === selected.arm && s.step === selected.step + 1),
  ].filter((s): s is Star => Boolean(s))

  return (
    <div className="relative flex flex-1 flex-col lg:flex-row">
      <div className="relative min-h-[55vh] flex-1 overflow-hidden bg-[#09080f] lg:min-h-0">
        <div className="absolute top-4 left-4 z-10 flex gap-1 rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur">
          <button
            type="button"
            aria-pressed={view === '3d'}
            disabled={!can3D}
            onClick={() => setView('3d')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-white/70 disabled:opacity-40',
              view === '3d' && can3D && 'bg-white/15 text-white',
            )}
          >
            <Orbit className="size-3.5" aria-hidden /> 3D
          </button>
          <button
            type="button"
            aria-pressed={!show3D}
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-white/70',
              !show3D && 'bg-white/15 text-white',
            )}
          >
            <List className="size-3.5" aria-hidden /> List view
          </button>
        </div>

        {show3D ? (
          // The canvas is a picture for the eyes; arrow keys move between stars, and the list view is always
          // there. role="application" hands arrow keys to us, which jsx-a11y doesn't count as interactive.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <div
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            role="application"
            aria-roledescription="genre galaxy"
            aria-label={`Genre galaxy. Selected: ${selected.name}. Arrow keys move along and between arms.`}
            onKeyDown={(e) => {
              const key = KEYS.find((k) => k === e.key)
              if (key) {
                e.preventDefault()
                setSelected(neighbour(all, selected, key))
              } else if (e.key === 'Enter' && tracks?.length)
                usePlayer.getState().playQueue(tracks, 0)
            }}
            className="focus-visible:outline-live absolute inset-0 outline-offset-[-4px]"
          >
            <Quiet>
              <Suspense
                fallback={
                  <Loader2
                    className="absolute inset-0 m-auto size-6 animate-spin text-white/60"
                    aria-hidden
                  />
                }
              >
                <GalaxyScene selected={selected.id} onSelect={setSelected} labels="all" />
              </Suspense>
            </Quiet>
          </div>
        ) : (
          <div className="stars h-full overflow-y-auto px-4 pt-16 pb-8 sm:px-6">
            {ARMS.map((arm, a) => (
              <section key={arm.name} aria-labelledby={`arm-${String(a)}`} className="mb-6">
                <h2
                  id={`arm-${String(a)}`}
                  className="spec mb-2"
                  style={{ color: `hsl(${String(arm.hue)} 85% 72%)` }}
                >
                  Arm {a + 1} · {arm.name}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {all
                    .filter((s) => s.arm === a)
                    .map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          aria-pressed={s.id === selected.id}
                          onClick={() => setSelected(s)}
                          className={cn(
                            'rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:border-white/40',
                            s.id === selected.id && 'border-[#6cf2c2] bg-[#6cf2c2]/15 text-white',
                          )}
                        >
                          {s.name}
                        </button>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <aside
        aria-labelledby="genre-h"
        className="border-line w-full border-t p-6 lg:w-[400px] lg:border-t-0 lg:border-l"
      >
        <p className="spec text-accent-text" aria-live="polite">
          Arm {selected.arm + 1} · {ARMS[selected.arm]?.name}
        </p>
        <h1 id="genre-h" className="font-display mt-1 text-5xl font-bold [font-stretch:85%]">
          {selected.name}
        </h1>
        <p className="text-muted mt-2 text-sm">Defined by {selected.seeds.join(' and ')}.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            disabled={!tracks?.length}
            onClick={() => tracks && usePlayer.getState().playQueue(tracks, 0)}
          >
            <Play /> Hear examples
          </Button>
          <Button asChild variant="ai" size="sm">
            <Link
              to="/app"
              search={{ vibe: `A journey through ${selected.name}, from classics to newer finds` }}
            >
              <Sparkles /> DJ this genre
            </Link>
          </Button>
        </div>
        <div className="mt-6">
          {error && (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          )}
          {!tracks && !error && (
            <Loader2 className="text-muted size-5 animate-spin" aria-label="Finding examples" />
          )}
          {tracks && <TrackList tracks={tracks} label={`${selected.name} examples`} />}
        </div>
        {neighbours.length > 0 && (
          <div className="mt-6">
            <p className="spec text-muted mb-2">Neighbours on this arm</p>
            <div className="flex flex-wrap gap-2">
              {neighbours.map((n) => (
                <Button key={n.id} size="sm" onClick={() => setSelected(n)}>
                  {n.name}
                </Button>
              ))}
            </div>
          </div>
        )}
        <ItunesCredit className="mt-6" />
      </aside>
    </div>
  )
}
