import { AppleMusicLink, ItunesCredit } from '@/components/AppleMusic'
import { TrackList } from '@/components/TrackRow'
import { Button } from '@/components/ui/button'
import { artistPage } from '@/lib/music'
import { useLoad } from '@/lib/useLoad'
import { usePlayer } from '@/player/store'
import { useSettings } from '@/stores/settings'
import { Link, useParams } from '@tanstack/react-router'
import { Loader2, Play, Sparkles } from 'lucide-react'
import { AlbumCard } from './SearchPage'

export function ArtistPage() {
  const { artistId } = useParams({ from: '/shell/app/artist/$artistId' })
  const country = useSettings((s) => s.country)
  const { data, error } = useLoad(() => artistPage(Number(artistId), country), [artistId, country])

  if (error)
    return (
      <p role="alert" className="text-danger mx-auto max-w-5xl p-6">
        {error}
      </p>
    )
  if (!data)
    return (
      <Loader2
        className="text-muted mx-auto mt-24 size-6 animate-spin"
        aria-label="Loading artist"
      />
    )
  const { artist, tracks, albums } = data
  if (!artist)
    return <p className="mx-auto max-w-5xl p-6">This artist isn't in the {country} store.</p>
  const top = tracks.slice(0, 10)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <section className="grooves relative overflow-hidden rounded-3xl px-6 py-14 sm:px-10">
        <p className="spec text-accent-text">Artist{artist.genre ? ` · ${artist.genre}` : ''}</p>
        <h1 className="font-display mt-2 text-5xl leading-none font-bold [font-stretch:80%] md:text-8xl">
          {artist.name}
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            onClick={() => usePlayer.getState().playQueue(top, 0)}
            disabled={!top.length}
          >
            <Play /> Play top songs
          </Button>
          <Button asChild variant="ai">
            <Link
              to="/app"
              search={{
                vibe: `Songs that feel like ${artist.name}, mixing them with similar artists`,
              }}
            >
              <Sparkles /> DJ a playlist like this
            </Link>
          </Button>
          <AppleMusicLink
            url={artist.url}
            label={`Open ${artist.name} in Apple Music`}
            className="text-sm"
          />
        </div>
      </section>
      {top.length > 0 && (
        <section aria-labelledby="top-h" className="mt-10">
          <h2 id="top-h" className="font-display mb-3 text-2xl font-semibold">
            Top songs
          </h2>
          <TrackList tracks={top} label={`Top songs by ${artist.name}`} />
        </section>
      )}
      {albums.length > 0 && (
        <section aria-labelledby="albums-h" className="mt-12">
          <h2 id="albums-h" className="font-display mb-4 text-2xl font-semibold">
            Albums
          </h2>
          <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {albums.map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </ul>
        </section>
      )}
      <ItunesCredit className="mt-6" />
    </div>
  )
}
