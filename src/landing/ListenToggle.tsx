import { AppleMusicBadge, ItunesCredit } from '@/components/AppleMusic'
import { Artwork } from '@/components/Artwork'
import { cn } from '@/lib/cn'
import { currentTrack, usePlayer } from '@/player/store'
import { useSettings } from '@/stores/settings'
import { Loader2, Pause, Play, Volume2 } from 'lucide-react'
import { useState } from 'react'

/**
 * Sound is opt-in, as on the best music sites. One tap plays today's most-played songs; the groove field
 * moves with them. While a preview plays, Apple's badge and the iTunes credit sit right next to it.
 */
export function ListenToggle({ className }: { className?: string }) {
  const track = usePlayer(currentTrack)
  const playing = usePlayer((s) => s.playing)
  const country = useSettings((s) => s.country)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function listen() {
    if (track) {
      usePlayer.getState().toggle()
      return
    }
    setBusy(true)
    setFailed(false)
    try {
      // The audio engine and the iTunes client load only now, so the landing page stays light.
      const [{ startEngine }, { charts }] = await Promise.all([
        import('@/player/engine'),
        import('@/lib/music'),
      ])
      startEngine()
      // Apple's charts feed can be slow on a cold server cache; one quiet retry before giving up.
      const chart = await charts(country).catch(async () => {
        await new Promise((r) => setTimeout(r, 1500))
        return charts(country)
      })
      const songs = chart.filter((t) => t.previewUrl).slice(0, 10)
      if (!songs.length) throw new Error('no previews')
      usePlayer.getState().playQueue(songs, 0)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn('flex flex-col items-end gap-2', className)}>
      <button
        type="button"
        onClick={() => void listen()}
        aria-pressed={playing}
        className="spec border-line bg-bg/70 hover:border-accent-text flex items-center gap-2 rounded-full border px-3.5 py-2 backdrop-blur transition-colors"
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : playing ? (
          <Pause className="size-3.5" aria-hidden />
        ) : track ? (
          <Play className="size-3.5" aria-hidden />
        ) : (
          <Volume2 className="size-3.5" aria-hidden />
        )}
        {playing ? 'Pause' : track ? 'Resume' : 'Listen while you scroll'}
      </button>
      {failed && (
        <p role="status" className="spec text-danger">
          Couldn't start the music. Try again.
        </p>
      )}
      {track && (
        <div
          role="group"
          aria-label="Now playing"
          className="border-line bg-bg/80 flex items-center gap-3 rounded-2xl border p-2 pr-3 backdrop-blur"
        >
          <Artwork src={track.artwork} size={100} className="size-11 rounded-lg" />
          <div className="max-w-44 min-w-0">
            <p className="truncate text-sm font-medium" aria-live="polite">
              {track.title}
            </p>
            <p className="text-muted truncate text-xs">{track.artist}</p>
            <ItunesCredit className="text-[9px]" />
          </div>
          <AppleMusicBadge url={track.url} />
        </div>
      )}
    </div>
  )
}
