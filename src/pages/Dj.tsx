import { aiLines, aiReady } from '@/ai/run'
import { ItunesCredit } from '@/components/AppleMusic'
import { EmptyState } from '@/components/EmptyState'
import { ExportButtons } from '@/components/ExportMenu'
import { Groove } from '@/components/Groove'
import { TrackList } from '@/components/TrackRow'
import { Button } from '@/components/ui/button'
import { savePlaylist, type Feedback, type PlaylistTrack } from '@/lib/db'
import { runDj } from '@/lib/dj'
import { musicConfigured } from '@/lib/music'
import { usePlayer } from '@/player/store'
import { useSettings } from '@/stores/settings'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Loader2, Play, Save, Sparkles, Wand2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export const EXAMPLE_VIBES = [
  'Rainy Sunday coding, lo-fi but not sleepy',
  'Golden hour drive along the coast',
  'Cooking dinner with friends, 70s soul',
  'Late-night train through a neon city',
  'First run of spring, upbeat but not cheesy',
  'Reading in a café, soft jazz and bossa nova',
]

const REFINES = [
  'More energy',
  'Less vocals',
  'Older songs',
  'Newer songs',
  'More obscure',
  'Warmer, slower',
]

type Status = 'idle' | 'running' | 'done' | 'error'

const titleFrom = (vibe: string) => {
  const t = vibe.split(/[,.;]/)[0]?.trim() ?? vibe
  return t.length > 40 ? `${t.slice(0, 40)}…` : t
}

export function Dj() {
  const { vibe: fromUrl } = useSearch({ from: '/shell/app' })
  const navigate = useNavigate()
  const country = useSettings((s) => s.country)
  const [vibe, setVibe] = useState(fromUrl ?? '')
  const [asked, setAsked] = useState('')
  const [tracks, setTracks] = useState<PlaylistTrack[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [ai, setAi] = useState<boolean | null>(null)
  const [dropped, setDropped] = useState(0)
  const [liner, setLiner] = useState<{ title: string; notes: string } | null>(null)
  const [savedId, setSavedId] = useState<string | undefined>()
  const [refineText, setRefineText] = useState('')
  const abort = useRef<AbortController | null>(null)

  async function run(v: string, refine?: string) {
    abort.current?.abort()
    const controller = new AbortController()
    abort.current = controller
    const previous = tracks
    setStatus('running')
    setDropped(0)
    if (!refine) {
      setAsked(v)
      setLiner(null)
      setSavedId(undefined)
    }
    const fresh: PlaylistTrack[] = []
    try {
      for await (const e of runDj({
        vibe: v,
        country,
        signal: controller.signal,
        ...(refine && { refine: { instruction: refine, tracks: previous } }),
      })) {
        if (e.type === 'start') setAi(e.ai)
        else if (e.type === 'dropped') setDropped((n) => n + 1)
        else {
          fresh.push(e.track)
          setTracks([...fresh])
        }
      }
      if (!fresh.length)
        throw new Error('Nothing matched on iTunes. Try describing it another way.')
      setStatus('done')
      void writeLiner(v, fresh, controller.signal)
    } catch (err) {
      if (controller.signal.aborted) return
      if (refine) setTracks(previous)
      setStatus('error')
      toast.error(err instanceof Error ? err.message : 'The DJ hit a snag. Please try again.')
    }
  }

  async function writeLiner(v: string, list: PlaylistTrack[], signal: AbortSignal) {
    if (!(await aiReady())) return
    try {
      const input = {
        vibe: v,
        tracks: list.map((t) => ({
          artist: t.artist,
          title: t.title,
          year: t.year,
          genre: t.genre,
        })),
      }
      for await (const l of aiLines('liner', input, signal))
        if (typeof l.title === 'string' && typeof l.notes === 'string')
          setLiner({ title: l.title.slice(0, 60), notes: l.notes.slice(0, 600) })
    } catch {
      // Liner notes are a bonus; the playlist stands without them.
    }
  }

  // The URL's ?vibe= drives the DJ: arriving from the landing page, an example chip or the form all set it.
  // Leaving (or StrictMode's test unmount) cancels the run; the effect starts it again on remount.
  useEffect(() => {
    // Starting the run is syncing with the URL; its first setState marks the DJ busy on purpose.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fromUrl) void run(fromUrl)
    return () => abort.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the asked-for vibe changes
  }, [fromUrl])

  const title = liner?.title ?? titleFrom(asked)

  function feedback(i: number, f: Feedback) {
    setTracks((list) => list.map((t, k) => (k === i ? { ...t, feedback: f } : t)))
  }

  async function save() {
    const id = await savePlaylist({
      id: savedId,
      title,
      vibe: asked,
      notes: liner?.notes ?? null,
      tracks,
    })
    setSavedId(id)
    toast.success('Saved to your library', {
      action: {
        label: 'Open',
        onClick: () =>
          void navigate({ to: '/app/playlist/$playlistId', params: { playlistId: id } }),
      },
    })
  }

  const submit = (v: string) => {
    const text = v.trim()
    if (text.length < 2) return
    // The same vibe again doesn't change the URL, so start it here; a new one starts from the effect.
    if (text === fromUrl) void run(text)
    else void navigate({ to: '/app', search: { vibe: text }, replace: true })
  }

  return (
    <div className="stars relative flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <form
          className="mx-auto max-w-3xl"
          onSubmit={(e) => {
            e.preventDefault()
            submit(vibe)
          }}
        >
          <label htmlFor="vibe" className="spec text-accent-text">
            Vibe DJ · describe the moment
          </label>
          <div className="border-line bg-surface focus-within:border-accent shadow-card mt-3 flex items-end gap-2 rounded-3xl border p-2 pl-5 transition-colors">
            <textarea
              id="vibe"
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  submit(vibe)
                }
              }}
              maxLength={300}
              rows={2}
              placeholder="Rainy Sunday coding, lo-fi but not sleepy"
              className="font-display placeholder:text-muted/70 min-h-14 flex-1 resize-none bg-transparent py-2 text-xl outline-none sm:text-2xl"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={status === 'running' || vibe.trim().length < 2}
            >
              {status === 'running' ? <Loader2 className="animate-spin" /> : <Sparkles />}
              <span className="hidden sm:inline">Make the playlist</span>
              <span className="sm:hidden">Go</span>
            </Button>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Example vibes">
            {EXAMPLE_VIBES.slice(0, 4).map((v) => (
              <li key={v}>
                <button
                  type="button"
                  onClick={() => {
                    setVibe(v)
                    submit(v)
                  }}
                  className="border-line text-muted hover:border-accent-text hover:text-text rounded-full border px-3 py-1.5 text-xs transition-colors"
                >
                  {v}
                </button>
              </li>
            ))}
          </ul>
          {!musicConfigured && (
            <p role="alert" className="text-danger mt-4 text-sm">
              Music search isn't set up on this deployment (no API address).
            </p>
          )}
          {ai === false && (
            <p
              role="status"
              className="border-accent-text/30 bg-accent/5 mt-4 rounded-xl border p-3 text-sm"
            >
              No AI provider yet, so this is a plain iTunes search for your words.{' '}
              <Link
                to="/settings"
                hash="ai"
                className="text-accent-text font-medium underline underline-offset-4"
              >
                Turn on the AI DJ
              </Link>{' '}
              (free) for real playlists.
            </p>
          )}
        </form>

        {tracks.length === 0 && status !== 'running' ? (
          <EmptyState art="/media/empty-playlist" title="Your next playlist starts with a sentence">
            Describe a place, a mood or a moment. Every song is checked against the iTunes
            catalogue, so nothing is made up, and every preview plays at once. No account, no
            Premium.
          </EmptyState>
        ) : (
          <section
            aria-labelledby="sleeve-h"
            className="mt-12 grid gap-10 lg:grid-cols-[320px_1fr]"
          >
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="mx-auto max-w-[160px] lg:max-w-[280px]">
                <Groove ids={tracks.map((t) => t.id)} />
              </div>
              <p className="spec text-muted mt-6">
                Side A · {String(tracks.length).padStart(2, '0')} tracks · 30s previews
              </p>
              <h2
                id="sleeve-h"
                className="font-display mt-2 text-4xl leading-tight font-bold [font-stretch:85%]"
              >
                {title || 'Your playlist'}
              </h2>
              {liner && <p className="text-muted mt-3 text-sm leading-relaxed">{liner.notes}</p>}
              {status === 'done' && dropped > 0 && (
                <p className="spec text-muted mt-3">
                  {dropped} suggestion{dropped === 1 ? '' : 's'} not on iTunes, left out
                </p>
              )}
              {status === 'done' && (
                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      onClick={() => usePlayer.getState().playQueue(tracks, 0)}
                    >
                      <Play /> Play all
                    </Button>
                    <Button onClick={() => void save()}>
                      <Save /> {savedId ? 'Save changes' : 'Save to library'}
                    </Button>
                  </div>
                  <ExportButtons
                    title={title}
                    tracks={tracks.filter((t) => t.feedback !== 'down')}
                  />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div aria-live="polite" className="sr-only">
                {status === 'running'
                  ? `Finding songs: ${String(tracks.length)} so far`
                  : status === 'done'
                    ? `${String(tracks.length)} songs ready`
                    : ''}
              </div>
              <TrackList tracks={tracks} label="Playlist" onFeedback={ai ? feedback : undefined} />
              {status === 'running' && (
                <p className="text-muted flex items-center gap-2 py-4 text-sm">
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Digging through the crates
                  and checking each song on iTunes…
                </p>
              )}
              {status === 'done' && ai && (
                <div className="border-line mt-6 rounded-2xl border p-4">
                  <p className="spec text-muted mb-3">Refine · thumbs count too</p>
                  <div className="flex flex-wrap gap-2">
                    {REFINES.map((r) => (
                      <Button key={r} size="sm" variant="ai" onClick={() => void run(asked, r)}>
                        {r}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="ai"
                      onClick={() => void run(asked, 'More songs like #1')}
                    >
                      More like #1
                    </Button>
                  </div>
                  <form
                    className="mt-3 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (refineText.trim().length > 1) void run(asked, refineText.trim())
                    }}
                  >
                    <label htmlFor="refine" className="sr-only">
                      Tell the DJ what to change
                    </label>
                    <input
                      id="refine"
                      value={refineText}
                      onChange={(e) => setRefineText(e.target.value)}
                      maxLength={200}
                      placeholder="e.g. more like #3, no ballads"
                      className="border-line bg-bg focus:border-accent h-9 flex-1 rounded-full border px-4 text-sm outline-none"
                    />
                    <Button size="sm" type="submit">
                      <Wand2 /> Refine
                    </Button>
                  </form>
                </div>
              )}
              <ItunesCredit className="mt-6" />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
