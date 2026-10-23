import type { PlaylistTrack } from '@/lib/db'
import { create } from 'zustand'

export interface PlayerState {
  queue: PlaylistTrack[]
  index: number
  playing: boolean
  /** 0..1 through the 30-second preview. */
  progress: number
  /** Set when a preview can't play (offline, blocked, unsupported codec). */
  error: string | null
  playQueue: (queue: PlaylistTrack[], index: number) => void
  toggle: () => void
  next: () => void
  prev: () => void
  stop: () => void
}

/** Only songs with a preview can be queued; the index is mapped to the filtered list. */
const playable = (queue: PlaylistTrack[], index: number) => {
  const target = queue[index]
  const list = queue.filter((t) => t.previewUrl)
  return {
    list,
    at: Math.max(
      0,
      list.findIndex((t) => t.id === target?.id),
    ),
  }
}

export const usePlayer = create<PlayerState>()((set, get) => ({
  queue: [],
  index: 0,
  playing: false,
  progress: 0,
  error: null,
  playQueue: (queue, index) => {
    const { list, at } = playable(queue, index)
    if (!list.length) return
    const cur = get().queue[get().index]
    // Pressing play on the song that is already loaded just pauses or resumes it.
    if (cur && cur.id === list[at]?.id) {
      set({ queue: list, index: at, playing: !get().playing })
      return
    }
    set({ queue: list, index: at, playing: true, progress: 0, error: null })
  },
  toggle: () => get().queue.length && set({ playing: !get().playing }),
  next: () => {
    const { index, queue } = get()
    if (index + 1 < queue.length) set({ index: index + 1, playing: true, progress: 0, error: null })
    else set({ playing: false, progress: 1 })
  },
  prev: () => set({ index: Math.max(0, get().index - 1), playing: true, progress: 0, error: null }),
  stop: () => set({ playing: false, queue: [], index: 0, progress: 0 }),
}))

export const currentTrack = (s: PlayerState): PlaylistTrack | undefined => s.queue[s.index]
