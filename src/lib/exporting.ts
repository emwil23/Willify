import { appleMusicUrl, type Track } from './music'

/** One "Artist – Title" line per song, for pasting anywhere (the owner's "copy playlist as text"). */
export const playlistAsText = (tracks: Pick<Track, 'artist' | 'title'>[]) =>
  tracks.map((t) => `${t.artist} – ${t.title}`).join('\n')

/** The playlist as text with a title and Apple Music links, for saving as a .txt file. */
export function playlistAsDocument(title: string, tracks: Track[]) {
  const lines = tracks.map(
    (t, i) =>
      `${String(i + 1).padStart(2, '0')}. ${t.artist} – ${t.title}\n    ${appleMusicUrl(t.url)}`,
  )
  return `${title}\n${'='.repeat(title.length)}\n\n${lines.join('\n')}\n\nMade with Willify · previews courtesy of iTunes\n`
}

const cell = (v: string | number | null) => {
  const s = v === null ? '' : String(v)
  // Quote when needed, and defuse spreadsheet formulas (=, +, -, @ at the start of a cell).
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function playlistAsCsv(tracks: Track[]) {
  const rows = [
    ['#', 'Title', 'Artist', 'Album', 'Year', 'Apple Music'],
    ...tracks.map((t, i) => [i + 1, t.title, t.artist, t.album, t.year, appleMusicUrl(t.url)]),
  ]
  return rows.map((r) => r.map(cell).join(',')).join('\r\n')
}

export function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const fileName = (title: string, ext: string) =>
  `${
    title
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'playlist'
  }.${ext}`
