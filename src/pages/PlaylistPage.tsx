import { ItunesCredit } from '@/components/AppleMusic'
import { ExportButtons } from '@/components/ExportMenu'
import { Groove } from '@/components/Groove'
import { TrackList } from '@/components/TrackRow'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { usePlayer } from '@/player/store'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Play, Sparkles, Trash2, Trophy } from 'lucide-react'
import { toast } from 'sonner'

export function PlaylistPage() {
  const { playlistId } = useParams({ from: '/shell/app/playlist/$playlistId' })
  const navigate = useNavigate()
  const p = useLiveQuery(() => db.playlists.get(playlistId).then((x) => x ?? null), [playlistId])

  if (p === undefined) return null
  if (p === null)
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p>This playlist isn't in this browser's library.</p>
        <Link to="/app/library" className="text-accent-text underline">
          Back to the library
        </Link>
      </div>
    )
  const tracks = p.tracks.filter((t) => t.feedback !== 'down')

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="mx-auto max-w-[260px]">
          <Groove ids={tracks.map((t) => t.id)} />
        </div>
        <p className="spec text-muted mt-6">Playlist · {tracks.length} tracks</p>
        <h1 className="font-display mt-2 text-4xl leading-tight font-bold [font-stretch:85%]">
          {p.title}
        </h1>
        {p.vibe && <p className="text-accent-text mt-2 text-sm">“{p.vibe}”</p>}
        {p.notes && <p className="text-muted mt-3 text-sm leading-relaxed">{p.notes}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => usePlayer.getState().playQueue(tracks, 0)}>
            <Play /> Play all
          </Button>
          {p.vibe && (
            <Button asChild variant="ai">
              <Link to="/app" search={{ vibe: p.vibe }}>
                <Sparkles /> Remix with the DJ
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link to="/app/quiz" search={{ playlist: p.id }}>
              <Trophy /> Quiz me
            </Link>
          </Button>
        </div>
        <div className="mt-3">
          <ExportButtons title={p.title} tracks={tracks} />
        </div>
        <Button
          variant="danger"
          size="sm"
          className="mt-6"
          onClick={() => {
            if (!confirm(`Delete “${p.title}” from this browser?`)) return
            void db.playlists.delete(p.id).then(() => {
              toast.success('Playlist deleted')
              void navigate({ to: '/app/library' })
            })
          }}
        >
          <Trash2 /> Delete playlist
        </Button>
      </div>
      <div className="min-w-0">
        <TrackList tracks={tracks} label={p.title} />
        <ItunesCredit className="mt-6" />
      </div>
    </div>
  )
}
