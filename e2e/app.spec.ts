import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

// The app is built with VITE_API_URL=http://api.test (playwright.config.ts). Every iTunes call, image and
// AI request is answered here, so the tests need no keys and no network.
const ART = readFileSync(new URL('../public/media/mode-dj.webp', import.meta.url))

let id = 1000
const track = (artist: string, title: string, over: Record<string, unknown> = {}) => ({
  kind: 'track',
  id: id++,
  title,
  artist,
  artistId: 77,
  album: `${title} - Single`,
  albumId: 88,
  artwork: `https://art.test/${encodeURIComponent(title)}/100x100bb.jpg`,
  previewUrl: `https://audio.test/${encodeURIComponent(title)}.m4a`,
  url: `https://music.apple.com/us/album/x/88?i=${String(id)}`,
  genre: 'Electronic',
  year: 2014,
  durationMs: 215000,
  explicit: false,
  ...over,
})

// The "real" catalogue the AI's suggestions are checked against.
const CATALOGUE = [
  track('Tycho', 'A Walk'),
  track('Bonobo', 'Kiara'),
  track('Nujabes', 'Feather'),
  track('Khruangbin', 'White Gloves'),
  track('Four Tet', 'Planet'),
  track('Caribou', 'Odessa'),
  track('Burial', 'Archangel'),
  track('Aphex Twin', 'Avril 14th'),
]

const json = (body: unknown) => ({ json: body, headers: { 'access-control-allow-origin': '*' } })

async function mockApi(page: Page) {
  await page.route('http://api.test/api/music/search*', (route) => {
    const url = new URL(route.request().url())
    const term = (url.searchParams.get('term') ?? '').toLowerCase()
    const entity = url.searchParams.get('entity')
    if (entity === 'album')
      return route.fulfill(
        json({
          results: [
            {
              kind: 'album',
              id: 88,
              title: 'Dive',
              artist: 'Tycho',
              artistId: 77,
              artwork: 'https://art.test/dive/100x100bb.jpg',
              url: 'https://music.apple.com/us/album/dive/88',
              genre: 'Electronic',
              year: 2011,
              trackCount: 2,
            },
          ],
        }),
      )
    if (entity === 'musicArtist')
      return route.fulfill(
        json({
          results: [
            {
              kind: 'artist',
              id: 77,
              name: 'Tycho',
              genre: 'Electronic',
              url: 'https://music.apple.com/us/artist/77',
            },
          ],
        }),
      )
    const exact = CATALOGUE.filter((t) => term.includes(t.title.toLowerCase()))
    // A search for the vibe's own words (no AI) gets the whole catalogue.
    return route.fulfill(
      json({ results: exact.length ? exact : term.includes('imaginary') ? [] : CATALOGUE }),
    )
  })
  await page.route('http://api.test/api/music/lookup*', (route) =>
    route.fulfill(
      json({
        results: [
          {
            kind: 'album',
            id: 88,
            title: 'Dive',
            artist: 'Tycho',
            artistId: 77,
            artwork: 'https://art.test/dive/100x100bb.jpg',
            url: 'https://music.apple.com/us/album/dive/88',
            genre: 'Electronic',
            year: 2011,
            trackCount: 2,
          },
          {
            kind: 'artist',
            id: 77,
            name: 'Tycho',
            genre: 'Electronic',
            url: 'https://music.apple.com/us/artist/77',
          },
          ...CATALOGUE.slice(0, 2),
        ],
      }),
    ),
  )
  await page.route('http://api.test/api/music/charts*', (route) =>
    route.fulfill(json({ results: CATALOGUE })),
  )
  await page.route('https://art.test/**', (route) =>
    route.fulfill({ body: ART, contentType: 'image/webp' }),
  )
  await page.route('https://audio.test/**', (route) => route.fulfill({ status: 404 }))
}

/** "Your own key" pointed at a fake OpenAI-compatible endpoint that streams the given lines. */
async function mockAi(page: Page, lines: object[]) {
  await page.addInitScript(() =>
    localStorage.setItem(
      'willify-settings',
      JSON.stringify({
        state: {
          provider: 'own',
          ownKey: 'test',
          ownBaseUrl: 'https://ai.test/v1',
          ownModel: 'm',
          country: 'US',
        },
        version: 0,
      }),
    ),
  )
  await page.route('https://ai.test/v1/chat/completions', (route) => {
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    const body = JSON.parse(route.request().postData() ?? '{}') as {
      messages: { content: string }[]
    }
    const prompt = body.messages.at(-1)?.content ?? ''
    const out = prompt.includes('liner notes')
      ? [{ title: 'Rain on the keys', notes: 'Soft electronics for heads-down work.' }]
      : lines
    const sse = out
      .map(
        (l) =>
          `data: ${JSON.stringify({ choices: [{ delta: { content: `${JSON.stringify(l)}\n` } }] })}\n\n`,
      )
      .join('')
    return route.fulfill({
      body: `${sse}data: [DONE]\n\n`,
      contentType: 'text/event-stream',
      headers: { 'access-control-allow-origin': '*' },
    })
  })
}

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('landing tells the story and starts the DJ @mobile', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Describe the moment.')
  await expect(page.getByText('Made with')).toContainText('EWSTUDIOS')
  await expect(page.getByRole('heading', { name: /four moves/i })).toBeVisible()
  await page.getByRole('textbox', { name: 'Describe a moment' }).fill('rainy sunday coding')
  await page.getByRole('button', { name: 'Make my playlist' }).click()
  await expect(page).toHaveURL(/\/app\?vibe=rainy/)
  await expect(page.getByRole('list', { name: 'Playlist' }).getByRole('listitem')).toHaveCount(8)
})

test('AI vibe → checked playlist → refine → save → export', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await mockAi(page, [
    { artist: 'Tycho', title: 'A Walk', why: 'Bright guitar against grey skies' },
    { artist: 'Loscil', title: 'Imaginary Song', why: 'Does not exist' },
    { artist: 'Bonobo', title: 'Kiara', why: 'A slow build' },
    { artist: 'Nujabes', title: 'Feather', why: 'Cosy jazz chords' },
  ])
  await page.goto('/app')
  await page.getByRole('textbox', { name: /describe the moment/i }).fill('Rainy Sunday coding')
  await page.getByRole('button', { name: /make the playlist/i }).click()

  const list = page.getByRole('list', { name: 'Playlist' })
  await expect(list.getByRole('listitem')).toHaveCount(3)
  await expect(list).toContainText('Bright guitar against grey skies')
  await expect(page.getByText('1 suggestion not on iTunes, left out')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Rain on the keys' })).toBeVisible()
  // Every song links to Apple Music.
  await expect(list.getByRole('link', { name: /in Apple Music/ })).toHaveCount(3)

  // Thumbs and refine keep the playlist checked.
  await list.getByRole('button', { name: 'More like A Walk by Tycho' }).click()
  await page.getByRole('button', { name: 'More energy' }).click()
  await expect(list.getByRole('listitem')).toHaveCount(3)
  await expect(list.getByRole('button', { name: 'More like A Walk by Tycho' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.getByRole('button', { name: 'Copy as text' }).click()
  // Windows puts CRLF on the clipboard.
  const copied = String(await page.evaluate('navigator.clipboard.readText()'))
  expect(copied.replace(/\r\n/g, '\n')).toBe('Tycho – A Walk\nBonobo – Kiara\nNujabes – Feather')

  const csv = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Save CSV' }).click()
  expect((await csv).suggestedFilename()).toBe('rain-on-the-keys.csv')

  await page.getByRole('button', { name: 'Save to library' }).click()
  await page.getByRole('link', { name: 'Library' }).click()
  await page.getByRole('link', { name: /Rain on the keys/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Rain on the keys' })).toBeVisible()
})

test('playing a preview shows the player with the Apple Music badge and credit', async ({
  page,
}) => {
  await page.goto('/app/search?q=tycho')
  await page.getByRole('button', { name: 'Play preview of A Walk by Tycho' }).click()
  const player = page.getByRole('region', { name: 'Player' })
  await expect(player).toContainText('A Walk')
  await expect(player.getByRole('link', { name: 'Listen on Apple Music' }).first()).toHaveAttribute(
    'href',
    /music\.apple\.com/,
  )
  await expect(player.getByText('Previews courtesy of iTunes').first()).toBeVisible()
})

test('search tabs lead to album and artist pages', async ({ page }) => {
  await page.goto('/app/search?q=tycho&tab=albums')
  await page.getByRole('link', { name: /Dive/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Dive' })).toBeVisible()
  await page.getByRole('main').getByRole('link', { name: 'Tycho' }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'Tycho' })).toBeVisible()
  await expect(
    page.getByRole('list', { name: 'Top songs by Tycho' }).getByRole('listitem'),
  ).toHaveCount(2)
})

test('the galaxy works from the keyboard in list view', async ({ page }) => {
  await page.goto('/app/galaxy')
  await page.getByRole('button', { name: 'List view' }).click()
  await page.getByRole('button', { name: 'Shoegaze' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Shoegaze' })).toBeVisible()
  await expect(page.getByText('Defined by My Bloody Valentine and Slowdive.')).toBeVisible()
})

test('daily quiz: clues first, preview and link at the reveal', async ({ page }) => {
  await page.goto('/app/quiz')
  const clues = page.getByRole('list', { name: 'Clues' })
  await expect(clues.getByRole('listitem')).toHaveCount(1)
  await page.getByRole('button', { name: /Show another clue/ }).click()
  await expect(clues.getByRole('listitem')).toHaveCount(2)
  await page.getByRole('group', { name: 'Answers' }).getByRole('button').first().click()
  await expect(page.getByRole('status').getByRole('link', { name: /in Apple Music/ })).toBeVisible()
  await expect(page.getByText(/Correct!|Not this time\./)).toBeVisible()
})

test('unknown pages get the designed 404', async ({ page }) => {
  await page.goto('/nowhere')
  await expect(page.getByRole('heading', { name: 'This track skipped.' })).toBeVisible()
})

const PAGES = [
  '/',
  '/developer',
  '/pro',
  '/privacy',
  '/terms',
  '/app',
  '/app/search?q=tycho',
  '/app/album/88',
  '/app/artist/77',
  '/app/galaxy',
  '/app/library',
  '/app/quiz',
  '/app/now-playing',
  '/settings',
  '/nowhere',
]

for (const path of PAGES) {
  for (const theme of ['dark', 'light'] as const) {
    test(`axe: ${path} (${theme}) has no violations`, async ({ page }) => {
      await page.addInitScript(
        (t) =>
          localStorage.setItem(
            'willify-settings',
            JSON.stringify({ state: { theme: t, country: 'US' }, version: 0 }),
          ),
        theme,
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(
        results.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
        ),
      ).toEqual([])
    })
  }
}
