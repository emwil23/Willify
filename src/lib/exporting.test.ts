import { describe, expect, it } from 'vitest'
import { fileName, playlistAsCsv, playlistAsDocument, playlistAsText } from './exporting'
import { appleMusicUrl, artworkAt, type Track } from './music'

const track = (title: string, artist: string, over: Partial<Track> = {}): Track => ({
  id: 1,
  title,
  artist,
  artistId: null,
  album: 'Album, "Deluxe"',
  albumId: null,
  artwork: null,
  previewUrl: null,
  url: 'https://music.apple.com/us/album/x/1?i=2',
  genre: null,
  year: 2001,
  durationMs: null,
  explicit: false,
  ...over,
})

describe('exports', () => {
  const list = [track('One More Time', 'Daft Punk'), track('=HYPERLINK("x")', 'Bad, Actor')]

  it('copies one "Artist – Title" line per song', () => {
    expect(playlistAsText(list)).toBe('Daft Punk – One More Time\nBad, Actor – =HYPERLINK("x")')
  })

  it('writes CSV with quoting and no formula injection', () => {
    const rows = playlistAsCsv(list).split('\r\n')
    expect(rows[0]).toBe('#,Title,Artist,Album,Year,Apple Music')
    expect(rows[1]).toBe(
      '1,One More Time,Daft Punk,"Album, ""Deluxe""",2001,https://music.apple.com/us/album/x/1?i=2',
    )
    expect(rows[2]).toContain(`"'=HYPERLINK(""x"")","Bad, Actor"`)
  })

  it('writes a text document with links and the iTunes credit', () => {
    const doc = playlistAsDocument('Rainy code', list)
    expect(doc).toContain(
      '01. Daft Punk – One More Time\n    https://music.apple.com/us/album/x/1?i=2',
    )
    expect(doc).toContain('courtesy of iTunes')
    expect(fileName('Rainy Sunday: code!', 'csv')).toBe('rainy-sunday-code.csv')
    expect(fileName('???', 'txt')).toBe('playlist.txt')
  })
})

describe('Apple links and artwork', () => {
  it('adds the affiliate token only when one is configured', () => {
    const url = 'https://music.apple.com/us/album/x/1?i=2'
    expect(appleMusicUrl(url, '')).toBe(url)
    expect(appleMusicUrl(url, 'abc123')).toBe(`${url}&at=abc123&ct=willify`)
  })

  it('asks the artwork CDN for another size', () => {
    expect(artworkAt('https://is1-ssl.mzstatic.com/image/thumb/a/b.jpg/100x100bb.jpg', 600)).toBe(
      'https://is1-ssl.mzstatic.com/image/thumb/a/b.jpg/600x600bb.jpg',
    )
    expect(artworkAt(null, 600)).toBeNull()
  })
})
