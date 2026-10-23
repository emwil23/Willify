import type { Track } from './music'

/** What the AI suggests: free text that may be misspelt, partly wrong or made up. */
export interface Suggestion {
  artist: string
  title: string
  why?: string
}

// Version notes that don't change which song it is: "(Remastered 2011)", "- Radio Edit", "[feat. X]".
const NOISE = /\s*[([][^)\]]*[)\]]|\s+-\s+.*$/g
// Words that mean a different recording than the one suggested, unless the suggestion asks for it.
const OTHER_RECORDING =
  /\b(karaoke|tribute|cover|instrumental|made famous|in the style of|8-bit|lullaby)\b/i

const VARIANT = /\b(remix|mix|live|edit|version|acoustic|demo|remaster(ed)?|sped up|slowed)\b/i

/** Lowercase, no accents, no version notes, no punctuation, "&" as "and". */
export function normalize(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(NOISE, '')
    .replace(/\b(feat|ft|featuring)\b.*$/, '')
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/^the /, '')
    .trim()
}

const words = (s: string) => new Set(normalize(s).split(' ').filter(Boolean))

/** Share of words in common (Jaccard), 0 to 1. */
function overlap(a: string, b: string) {
  const x = words(a)
  const y = words(b)
  if (!x.size || !y.size) return 0
  let common = 0
  for (const w of x) if (y.has(w)) common++
  return common / (x.size + y.size - common)
}

export function titleMatches(suggested: string, found: string) {
  const a = normalize(suggested)
  const b = normalize(found)
  if (!a || !b) return false
  return a === b || overlap(a, b) >= 0.75
}

/** True when the found artist credit includes the suggested (main) artist. Credits list several names. */
export function artistMatches(suggested: string, found: string) {
  const credit = normalize(found)
  // The whole name first ("Earth, Wind & Fire"), then the first of several ("Daft Punk & Pharrell").
  const names = [suggested, suggested.split(/,|&| x | and | feat\.? | ft\.? /i)[0] ?? ''].map(
    normalize,
  )
  return names.some(
    (name) =>
      name.length > 1 &&
      (credit === name || ` ${credit} `.includes(` ${name} `) || overlap(name, credit) >= 0.6),
  )
}

/**
 * The iTunes result that really is the suggested song, or null. Prefers the original recording with a
 * preview over karaoke and tribute versions. This is what keeps made-up songs out of a playlist.
 */
export function bestMatch(s: Suggestion, candidates: Track[]): Track | null {
  const wantsOther = OTHER_RECORDING.test(s.title)
  const ok = candidates.filter(
    (t) =>
      titleMatches(s.title, t.title) &&
      artistMatches(s.artist, t.artist) &&
      (wantsOther || !OTHER_RECORDING.test(`${t.title} ${t.artist} ${t.album ?? ''}`)),
  )
  // A remix, live take or edit counts as the song, but the original wins unless one was asked for.
  const score = (t: Track) =>
    (t.previewUrl ? 4 : 0) +
    (normalize(t.title) === normalize(s.title) ? 2 : 0) +
    (VARIANT.test(t.title) === VARIANT.test(s.title) ? 1 : 0)
  return ok.sort((a, b) => score(b) - score(a))[0] ?? null
}

export interface Checked {
  suggestion: Suggestion
  track: (Track & { why?: string }) | null
}

/**
 * Checks each suggestion against iTunes, `concurrency` at a time, yielding results as they finish.
 * Duplicates (the same iTunes song suggested twice) come back as null.
 */
export async function* verify(
  suggestions: AsyncIterable<Suggestion> | Iterable<Suggestion>,
  search: (term: string) => Promise<Track[]>,
  concurrency = 3,
): AsyncGenerator<Checked> {
  const seen = new Set<number>()
  const running = new Set<Promise<Checked>>()
  const check = async (s: Suggestion): Promise<Checked> => {
    const found = await search(`${s.artist} ${s.title}`.slice(0, 100)).catch(() => [] as Track[])
    const track = bestMatch(s, found)
    return { suggestion: s, track: track ? { ...track, why: s.why } : null }
  }
  const settle = async () => {
    const done = await Promise.race([...running].map((p) => p.then((r) => ({ p, r }))))
    running.delete(done.p)
    const id = done.r.track?.id
    if (id !== undefined && seen.has(id)) return { ...done.r, track: null }
    if (id !== undefined) seen.add(id)
    return done.r
  }
  for await (const s of suggestions) {
    if (!s.artist.trim() || !s.title.trim()) continue
    running.add(check(s))
    if (running.size >= concurrency) yield await settle()
  }
  while (running.size) yield await settle()
}
