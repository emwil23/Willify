import { cn } from '@/lib/cn'
import { db, toggleLike, type Feedback, type PlaylistTrack } from '@/lib/db'
import { formatDuration } from '@/lib/music'
import { currentTrack, usePlayer } from '@/player/store'
import { Link } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Heart, Pause, Play, ThumbsDown, ThumbsUp } from 'lucide-react'
import { AppleMusicLink } from './AppleMusic'
import { Artwork } from './Artwork'

const iconBtn =
  'grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-40 [&_svg]:size-4'

/** One song: play its preview, like it, thumb it, open it on Apple Music. */
export function TrackRow({
  track,
  index,
  queue,
  onFeedback,
}: {
  track: PlaylistTrack
  index: number
  /** The list it plays in, so next/previous follow it. */
  queue: PlaylistTrack[]
  onFeedback?: (f: Feedback) => void
}) {
  const isCurrent = usePlayer((s) => currentTrack(s)?.id === track.id)
  const playing = usePlayer((s) => s.playing) && isCurrent
  const liked = useLiveQuery(() => db.likes.get(track.id).then(Boolean), [track.id])
  const name = `${track.title} by ${track.artist}`

  return (
    <li
      className={cn(
        'group border-line/60 flex items-center gap-3 border-b py-2.5 last:border-0',
        track.feedback === 'down' && 'opacity-50',
      )}
    >
      <span
        className="spec text-muted hidden w-6 shrink-0 text-right tabular-nums sm:block"
        aria-hidden
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      <button
        type="button"
        className="relative size-12 shrink-0 overflow-hidden rounded-lg"
        onClick={() => usePlayer.getState().playQueue(queue, index)}
        disabled={!track.previewUrl}
        aria-label={`${playing ? 'Pause' : 'Play'} preview of ${name}`}
        aria-pressed={playing}
      >
        <Artwork src={track.artwork} size={100} className="size-full" />
        <span
          className={cn(
            'absolute inset-0 grid place-items-center bg-black/50 text-white transition-opacity [&_svg]:size-5',
            isCurrent
              ? 'opacity-100'
              : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100',
          )}
          aria-hidden
        >
          {playing ? <Pause /> : <Play />}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-medium', isCurrent && 'text-live')}>
          {track.title}
          {track.explicit && (
            <span
              className="spec border-line text-muted ml-2 rounded border px-1 align-middle"
              title="Explicit"
            >
              E
            </span>
          )}
        </p>
        <p className="text-muted truncate text-sm">
          {track.artistId ? (
            <Link
              to="/app/artist/$artistId"
              params={{ artistId: String(track.artistId) }}
              className="hover:text-text hover:underline"
            >
              {track.artist}
            </Link>
          ) : (
            track.artist
          )}
          {track.album && <span className="hidden md:inline"> · {track.album}</span>}
        </p>
        {track.why && <p className="text-accent-text mt-0.5 line-clamp-2 text-xs">{track.why}</p>}
      </div>
      <span className="spec text-muted hidden tabular-nums sm:block">
        {formatDuration(track.durationMs)}
      </span>
      {onFeedback && (
        <div className="flex">
          <button
            type="button"
            className={cn(iconBtn, track.feedback === 'up' && 'text-live')}
            aria-label={`More like ${name}`}
            aria-pressed={track.feedback === 'up'}
            onClick={() => onFeedback(track.feedback === 'up' ? null : 'up')}
          >
            <ThumbsUp />
          </button>
          <button
            type="button"
            className={cn(iconBtn, track.feedback === 'down' && 'text-danger')}
            aria-label={`Less like ${name}`}
            aria-pressed={track.feedback === 'down'}
            onClick={() => onFeedback(track.feedback === 'down' ? null : 'down')}
          >
            <ThumbsDown />
          </button>
        </div>
      )}
      <button
        type="button"
        className={cn(iconBtn, liked && 'text-danger')}
        aria-label={`Like ${name}`}
        aria-pressed={Boolean(liked)}
        onClick={() => void toggleLike(track)}
      >
        <Heart className={cn(liked && 'fill-current')} />
      </button>
      <AppleMusicLink url={track.url} label={`Open ${name} in Apple Music`} />
    </li>
  )
}

export function TrackList({
  tracks,
  label,
  onFeedback,
}: {
  tracks: PlaylistTrack[]
  label: string
  onFeedback?: (index: number, f: Feedback) => void
}) {
  return (
    <ol aria-label={label}>
      {tracks.map((t, i) => (
        <TrackRow
          key={t.id}
          track={t}
          index={i}
          queue={tracks}
          {...(onFeedback && { onFeedback: (f: Feedback) => onFeedback(i, f) })}
        />
      ))}
    </ol>
  )
}
