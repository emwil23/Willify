import { ItunesCredit } from '@/components/AppleMusic'
import { Artwork } from '@/components/Artwork'
import { EmptyState } from '@/components/EmptyState'
import { TrackList } from '@/components/TrackRow'
import { cn } from '@/lib/cn'
import {
  searchAlbums,
  searchArtists,
  searchTracks,
  type Album,
  type Artist,
  type Track,
} from '@/lib/music'
import { useSettings } from '@/stores/settings'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Loader2, Search } from 'lucide-react'
import { useLoad } from '@/lib/useLoad'
import { useEffect, useState } from 'react'

const TABS = [
  { id: 'songs', label: 'Songs' },
  { id: 'albums', label: 'Albums' },
  { id: 'artists', label: 'Artists' },
] as const

type Results = { songs: Track[] } | { albums: Album[] } | { artists: Artist[] }

export function SearchPage() {
  const { q = '', tab = 'songs' } = useSearch({ from: '/shell/app/search' })
  const navigate = useNavigate({ from: '/app/search' })
  const country = useSettings((s) => s.country)
  const [text, setText] = useState(q)

  // Typing updates the URL after a pause, so results are shareable and the back button works.
  useEffect(() => {
    const id = setTimeout(() => {
      if (text.trim() !== q)
        void navigate({ search: (s) => ({ ...s, q: text.trim() || undefined }), replace: true })
    }, 400)
    return () => clearTimeout(id)
  }, [text, q, navigate])

  const {
    data: results,
    error,
    loading,
  } = useLoad<Results | null>(
    () =>
      !q
        ? Promise.resolve(null)
        : tab === 'songs'
          ? searchTracks(q, country, 25).then((songs) => ({ songs }))
          : tab === 'albums'
            ? searchAlbums(q, country).then((albums) => ({ albums }))
            : searchArtists(q, country).then((artists) => ({ artists })),
    [q, tab, country],
  )
  const state = error ? 'error' : loading && q ? 'loading' : 'idle'

  const count = !results
    ? 0
    : 'songs' in results
      ? results.songs.length
      : 'albums' in results
        ? results.albums.length
        : results.artists.length

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-5xl font-bold [font-stretch:85%]">Search</h1>
      <form role="search" className="mt-6" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="q" className="sr-only">
          Search songs, albums and artists
        </label>
        <div className="border-line bg-surface focus-within:border-accent flex items-center gap-3 rounded-full border px-5">
          <Search className="text-muted size-5" aria-hidden />
          <input
            id="q"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="A song, an album, an artist"
            maxLength={100}
            autoComplete="off"
            className="h-14 flex-1 bg-transparent text-lg outline-none"
          />
          {state === 'loading' && (
            <Loader2 className="text-muted size-5 animate-spin" aria-label="Searching" />
          )}
        </div>
      </form>
      <div role="tablist" aria-label="Result type" className="mt-4 flex gap-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            to="/app/search"
            search={(s) => ({ ...s, tab: t.id === 'songs' ? undefined : t.id })}
            role="tab"
            aria-selected={tab === t.id}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm transition-colors',
              tab === t.id ? 'bg-surface-2 text-text' : 'text-muted hover:text-text',
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab)?.label} className="mt-6">
        {state === 'error' && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        {!q && (
          <EmptyState art="/media/empty-search" title="What are you in the mood for?">
            Search Apple's catalogue of songs, albums and artists, and play any 30-second preview at
            once.
          </EmptyState>
        )}
        {q && results && count === 0 && state === 'idle' && (
          <EmptyState art="/media/empty-search" title={`Nothing for “${q}”`}>
            Check the spelling, or try the artist's name on its own.
          </EmptyState>
        )}
        {results && 'songs' in results && results.songs.length > 0 && (
          <TrackList tracks={results.songs} label={`Songs for ${q}`} />
        )}
        {results && 'albums' in results && (
          <ul
            aria-label={`Albums for ${q}`}
            className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4"
          >
            {results.albums.map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </ul>
        )}
        {results && 'artists' in results && (
          <ul aria-label={`Artists for ${q}`} className="divide-line divide-y">
            {results.artists.map((a) => (
              <li key={a.id}>
                <Link
                  to="/app/artist/$artistId"
                  params={{ artistId: String(a.id) }}
                  className="hover:bg-surface flex items-center justify-between gap-3 rounded-xl px-3 py-3"
                >
                  <span className="font-medium">{a.name}</span>
                  <span className="spec text-muted">{a.genre}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {count > 0 && <ItunesCredit className="mt-6" />}
      </div>
    </div>
  )
}

export function AlbumCard({ album }: { album: Album }) {
  return (
    <li>
      <Link to="/app/album/$albumId" params={{ albumId: String(album.id) }} className="group block">
        <Artwork
          src={album.artwork}
          size={300}
          className="aspect-square w-full rounded-xl transition-transform group-hover:-translate-y-1"
        />
        <p className="mt-2 truncate text-sm font-medium">{album.title}</p>
        <p className="text-muted truncate text-xs">
          {album.artist}
          {album.year ? ` · ${String(album.year)}` : ''}
        </p>
      </Link>
    </li>
  )
}
