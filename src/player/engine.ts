import { db } from '@/lib/db'
import { artworkAt } from '@/lib/music'
import { currentTrack, usePlayer } from './store'

// Two <audio> decks routed through Web Audio: a gain node each for 1.5s crossfades, and one shared analyser
// that drives the visualiser and the galaxy. Previews stream from Apple's servers (their CORS headers allow
// the analyser to read them); nothing is downloaded or cached.

const FADE_S = 1.5
const COUNT_AFTER_S = 5

interface Deck {
  el: HTMLAudioElement
  gain: GainNode | null
}

let ctx: AudioContext | null = null
let analyser: AnalyserNode | null = null
const decks: Deck[] = []
let active = 0
let loadedId: number | null = null
let counted = false

function deck(i: number): Deck {
  let d = decks[i]
  if (!d) {
    const el = new Audio()
    el.crossOrigin = 'anonymous'
    el.preload = 'auto'
    d = { el, gain: null }
    decks[i] = d
    el.addEventListener('timeupdate', () => {
      if (i !== active) return
      usePlayer.setState({ progress: el.duration ? el.currentTime / el.duration : 0 })
      if (!counted && el.currentTime >= COUNT_AFTER_S) {
        counted = true
        const t = currentTrack(usePlayer.getState())
        if (t)
          void db.plays.add({ trackId: t.id, artist: t.artist, genre: t.genre, at: Date.now() })
      }
    })
    el.addEventListener('ended', () => i === active && usePlayer.getState().next())
    el.addEventListener('error', () => {
      if (i !== active || !el.getAttribute('src')) return
      usePlayer.setState({ playing: false, error: "This preview can't play right now." })
    })
  }
  return d
}

/** Web Audio starts on the first play (browsers only allow it after a click). */
function wire() {
  if (ctx || typeof AudioContext === 'undefined') return
  try {
    ctx = new AudioContext()
    analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8
    analyser.connect(ctx.destination)
    for (const i of [0, 1]) {
      const d = deck(i)
      d.gain = ctx.createGain()
      ctx.createMediaElementSource(d.el).connect(d.gain).connect(analyser)
    }
  } catch {
    // Plain <audio> still plays; there's just no crossfade or visualiser.
    ctx = null
    analyser = null
  }
}

function fade(d: Deck, to: number, seconds: number) {
  if (!ctx || !d.gain) {
    d.el.volume = to
    return
  }
  const g = d.gain.gain
  g.cancelScheduledValues(ctx.currentTime)
  g.setValueAtTime(g.value, ctx.currentTime)
  g.linearRampToValueAtTime(to, ctx.currentTime + seconds)
}

function load(url: string, id: number) {
  const out = deck(active)
  active = 1 - active
  const next = deck(active)
  const fadeOut = out.el.paused ? 0 : FADE_S
  fade(out, 0, fadeOut)
  setTimeout(() => out.el.pause(), fadeOut * 1000)
  next.el.src = url
  fade(next, 0, 0)
  fade(next, 1, out.el.paused ? 0.05 : FADE_S)
  loadedId = id
  counted = false
}

/** Live frequency levels (0..255), or null before anything has played. */
export function frequencies(into: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> | null {
  if (!analyser) return null
  analyser.getByteFrequencyData(into)
  return into
}

/** Overall loudness 0..1, smoothed by the analyser; for pulsing things to the beat. */
const levelBuf = new Uint8Array(128)
export function level(): number {
  const f = frequencies(levelBuf)
  if (!f) return 0
  let sum = 0
  for (let i = 0; i < 32; i++) sum += f[i] ?? 0
  return sum / (32 * 255)
}

function mediaSession() {
  if (!('mediaSession' in navigator)) return
  const ms = navigator.mediaSession
  ms.setActionHandler('play', () => usePlayer.setState({ playing: true }))
  ms.setActionHandler('pause', () => usePlayer.setState({ playing: false }))
  ms.setActionHandler('nexttrack', () => usePlayer.getState().next())
  ms.setActionHandler('previoustrack', () => usePlayer.getState().prev())
}

let started = false
/** Connects the store to the decks. Called once by the player bar. */
export function startEngine() {
  if (started) return
  started = true
  mediaSession()
  usePlayer.subscribe((s, prev) => {
    const t = currentTrack(s)
    if (!t?.previewUrl) {
      if (prev.queue.length && !s.queue.length) for (const d of decks) d.el.pause()
      return
    }
    if (s.playing) wire()
    if (t.id !== loadedId) load(t.previewUrl, t.id)
    const el = deck(active).el
    if (s.playing && el.paused) {
      void ctx?.resume()
      el.play().catch(() =>
        usePlayer.setState({ playing: false, error: "This preview can't play right now." }),
      )
    } else if (!s.playing && !el.paused) el.pause()

    if ('mediaSession' in navigator && t.id !== currentTrack(prev)?.id) {
      const art = artworkAt(t.artwork, 512)
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title,
        artist: t.artist,
        album: t.album ?? '',
        artwork: art ? [{ src: art, sizes: '512x512', type: 'image/jpeg' }] : [],
      })
    }
    if ('mediaSession' in navigator)
      navigator.mediaSession.playbackState = s.playing ? 'playing' : 'paused'
  })
}
