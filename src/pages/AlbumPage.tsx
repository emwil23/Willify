import { AppleMusicLink, ItunesCredit } from '@/components/AppleMusic'
import { Artwork } from '@/components/Artwork'
import { TrackList } from '@/components/TrackRow'
import { Button } from '@/components/ui/button'
import { albumWithTracks } from '@/lib/music'
import { usePlayer } from '@/player/store'
import { useSettings } from '@/stores/settings'
import { useLoad } from '@/lib/useLoad'
import { Link, useParams } from '@tanstack/react-router'
import { Loader2, Play } from 'lucide-react'

/** An album as a record sleeve: big artwork, the track list, a link to Apple Music. */
export function AlbumPage() {
  const { albumId } = useParams({ from: '/shell/app/album/$albumId' })
  const country = useSettings((s) => s.country)
  const { data, error } = useLoad(
    () => albumWithTracks(Number(albumId), country),
    [albumId, country],
  )

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
        aria-label="Loading album"
      />
    )
  const { album, tracks } = data
  if (!album)
    return <p className="mx-auto max-w-5xl p-6">This album isn't in the {country} store.</p>

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="grid items-end gap-8 md:grid-cols-[300px_1fr]">
        <div className="grooves relative rounded-2xl p-3">
          <Artwork
            src={album.artwork}
            size={600}
            eager
            alt={`Artwork for ${album.title}`}
            className="shadow-card aspect-square w-full rounded-xl"
          />
        </div>
        <div>
          <p className="spec text-accent-text">
            Album{album.year ? ` · ${String(album.year)}` : ''}
            {album.genre ? ` · ${album.genre}` : ''}
          </p>
          <h1 className="font-display mt-2 text-4xl leading-tight font-bold [font-stretch:85%] md:text-6xl">
            {album.title}
          </h1>
          <p className="text-muted mt-2 text-lg">
            {album.artistId ? (
              <Link
                to="/app/artist/$artistId"
                params={{ artistId: String(album.artistId) }}
                className="hover:text-text hover:underline"
              >
                {album.artist}
              </Link>
            ) : (
              album.artist
            )}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={() => usePlayer.getState().playQueue(tracks, 0)}
              disabled={!tracks.some((t) => t.previewUrl)}
            >
              <Play /> Play previews
            </Button>
            <AppleMusicLink
              url={album.url}
              label={`Open ${album.title} in Apple Music`}
              className="text-sm"
            />
          </div>
        </div>
      </div>
      <div className="mt-10">
        <TrackList tracks={tracks} label={`Songs on ${album.title}`} />
      </div>
      <ItunesCredit className="mt-6" />
    </div>
  )
}
