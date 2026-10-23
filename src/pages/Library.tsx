import { Artwork } from '@/components/Artwork'
import { EmptyState } from '@/components/EmptyState'
import { ExportButtons } from '@/components/ExportMenu'
import { TrackList } from '@/components/TrackRow'
import { Button } from '@/components/ui/button'
import { db, type Playlist } from '@/lib/db'
import { weekInMusic } from '@/lib/stats'
import { Link } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Sparkles } from 'lucide-react'

/** A sleeve: the first four covers as a collage, like a playlist cover. */
function Sleeve({ p }: { p: Playlist }) {
  const covers = p.tracks.slice(0, 4)
  return (
    <li>
      <Link to="/app/playlist/$playlistId" params={{ playlistId: p.id }} className="group block">
        <div className="bg-surface-2 shadow-card grid aspect-square grid-cols-2 overflow-hidden rounded-xl transition-transform group-hover:-translate-y-1">
          {covers.map((t) => (
            <Artwork
              key={t.id}
              src={t.artwork}
              size={200}
              className={covers.length === 1 ? 'col-span-2 row-span-2 size-full' : 'size-full'}
            />
          ))}
        </div>
        <p className="mt-2 truncate font-medium">{p.title}</p>
        <p className="spec text-muted">{p.tracks.length} tracks</p>
      </Link>
    </li>
  )
}

function WeekCard() {
  const plays = useLiveQuery(
    () =>
      db.plays
        .where('at')
        .above(Date.now() - 7 * 864e5)
        .toArray(),
    [],
  )
  if (!plays) return null
  const w = weekInMusic(plays)
  const max = Math.max(...w.days, 1)
  return (
    <section aria-labelledby="week-h" className="border-line bg-surface rounded-3xl border p-6">
      <p className="spec text-accent-text">On this device only</p>
      <h2 id="week-h" className="font-display mt-1 text-2xl font-semibold">
        Your week in music
      </h2>
      {w.plays === 0 ? (
        <p className="text-muted mt-3 text-sm">Play a few previews and your week shows up here.</p>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          <div>
            <p className="font-display text-5xl font-bold">{w.plays}</p>
            <p className="text-muted text-sm">previews played</p>
            <div
              className="mt-3 flex h-10 items-end gap-1"
              role="img"
              aria-label={`Plays per day this week: ${w.days.join(', ')}`}
            >
              {w.days.map((d, i) => (
                <span
                  key={i}
                  className="bg-live w-3 rounded-sm"
                  style={{
                    height: `${String(Math.max(8, (d / max) * 100))}%`,
                    opacity: d ? 1 : 0.25,
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="spec text-muted mb-2">Top artists</p>
            <ol className="space-y-1 text-sm">
              {w.artists.map((a) => (
                <li key={a.name}>
                  {a.name} <span className="text-muted">· {a.plays}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="spec text-muted mb-2">Top genre</p>
            <p className="font-display text-2xl">{w.genre ?? '—'}</p>
          </div>
        </div>
      )}
    </section>
  )
}

export function Library() {
  const playlists = useLiveQuery(() => db.playlists.orderBy('updatedAt').reverse().toArray(), [])
  const likes = useLiveQuery(() => db.likes.orderBy('at').reverse().toArray(), [])
  const liked = likes?.map((l) => l.track) ?? []

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-5xl font-bold [font-stretch:85%]">Library</h1>
      <p className="text-muted mt-2">Kept in this browser. Nothing here leaves your device.</p>

      <div className="mt-8">
        <WeekCard />
      </div>

      <section aria-labelledby="pl-h" className="mt-12">
        <h2 id="pl-h" className="font-display mb-4 text-3xl font-semibold">
          Playlists
        </h2>
        {playlists && playlists.length === 0 ? (
          <EmptyState
            art="/media/empty-library"
            title="No playlists yet"
            action={
              <Button asChild variant="primary">
                <Link to="/app">
                  <Sparkles /> Make one with the DJ
                </Link>
              </Button>
            }
          >
            Save a playlist from the DJ and it lives here, ready to play or export.
          </EmptyState>
        ) : (
          <ul
            aria-label="Playlists"
            className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5"
          >
            {playlists?.map((p) => (
              <Sleeve key={p.id} p={p} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="liked-h" className="mt-14">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 id="liked-h" className="font-display text-3xl font-semibold">
            Liked songs
          </h2>
          {liked.length > 0 && <ExportButtons title="Liked songs" tracks={liked} />}
        </div>
        {likes && liked.length === 0 ? (
          <EmptyState art="/media/empty-likes" title="Nothing liked yet">
            Tap the heart on any song to keep it here.
          </EmptyState>
        ) : (
          <TrackList tracks={liked} label="Liked songs" />
        )}
      </section>
    </div>
  )
}
