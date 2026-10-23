// Takes the README screenshots in docs/ from a production build.
// Songs, previews and artwork are real: the build talks to a local ew-apps-api, which asks iTunes.
// The AI replies are real Gemini answers to the server's own prompts, recorded once in
// scripts/screenshot-fixtures.json and replayed here, so the pictures are repeatable and spend no quota.
// 1. Run ew-apps-api locally with http://localhost:4180 in ALLOWED_ORIGINS.
// 2. `VITE_API_URL=http://localhost:8788 npm run build && npx serve dist -c ../serve.json -l 4180`
// 3. `node scripts/screenshots.mjs`
// ANGLE on D3D11 uses the real GPU even headless, so the WebGL galaxy and visualiser render.
import { readFile } from 'node:fs/promises'
import { chromium, devices } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:4180'
const AI = 'http://ai.test/v1'
const docs = (name) =>
  new URL(`../docs/${name}.png`, import.meta.url).pathname.replace(/^\/(\w:)/, '$1')
const fixtures = JSON.parse(
  await readFile(new URL('./screenshot-fixtures.json', import.meta.url), 'utf8'),
)

function answer(prompt) {
  if (prompt.includes('liner notes')) return fixtures.liner.output
  if (prompt.includes('Rework this playlist')) return fixtures.refine.output
  return fixtures.vibe.output
}

async function mockAi(page) {
  await page.route(`${AI}/**`, async (route) => {
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    const content = answer(route.request().postDataJSON().messages.at(-1).content)
    const pieces = content.match(/[\s\S]{1,24}/g) ?? []
    const body = pieces
      .map((c) => `data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`)
      .join('')
    return route.fulfill({
      headers: { ...headers, 'content-type': 'text/event-stream' },
      body: `${body}data: [DONE]\n\n`,
    })
  })
}

// Installed Edge plays Apple's AAC previews (Playwright's Chromium has no AAC), so the visualiser moves.
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL ?? 'msedge',
  args: ['--use-angle=d3d11', '--enable-gpu', '--autoplay-policy=no-user-gesture-required'],
})

async function open(options = {}, settings = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    ...options,
  })
  await ctx.addInitScript(
    ([ai, s]) =>
      localStorage.setItem(
        'willify-settings',
        JSON.stringify({
          state: { provider: 'own', ownKey: 'demo', ownBaseUrl: ai, ownModel: 'gemini', country: 'US', ...s },
          version: 0,
        }),
      ),
    [AI, settings],
  )
  const p = await ctx.newPage()
  await mockAi(p)
  return { ctx, p }
}

async function dj(p) {
  await p.goto(`${BASE}/app?vibe=${encodeURIComponent(fixtures.vibe.input)}`)
  await p.getByRole('heading', { name: JSON.parse(fixtures.liner.output).title }).waitFor({ timeout: 60_000 })
  await p.waitForLoadState('networkidle')
  await p.waitForTimeout(800)
}

// Landing, story, developer, 404: desktop, dark.
{
  const { ctx, p } = await open()
  await p.goto(`${BASE}/`)
  await p.locator('canvas').waitFor({ timeout: 15_000 })
  await p.waitForTimeout(2500)
  await p.screenshot({ path: docs('landing') })
  await p.evaluate(() => window.scrollTo(0, document.querySelector('#how').offsetTop + window.innerHeight * 1.2))
  await p.waitForTimeout(2000)
  await p.screenshot({ path: docs('story') })
  await p.goto(`${BASE}/developer`)
  await p.waitForTimeout(2500)
  await p.screenshot({ path: docs('developer') })
  await p.goto(`${BASE}/nowhere`)
  await p.waitForTimeout(1500)
  await p.screenshot({ path: docs('not-found') })
  await ctx.close()
}

// The DJ, refine, library, search, album, galaxy, now playing, quiz.
{
  const { ctx, p } = await open()
  await dj(p)
  await p.screenshot({ path: docs('dj') })
  await p.getByRole('button', { name: /^More like A Walk/ }).click()
  await p.getByRole('button', { name: 'Save to library' }).click()
  await p.getByRole('button', { name: 'More energy' }).click()
  // Done when the form button is enabled again.
  await p.waitForFunction(() => !document.querySelector('form button[type=submit]')?.disabled, null, { timeout: 60_000 })
  await p.waitForLoadState('networkidle')
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.waitForTimeout(1200)
  await p.screenshot({ path: docs('refine') })

  // A week of listening for the stats card, written straight into the app's database.
  await p.evaluate(async () => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('willify')
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error)
    })
    const tx = db.transaction('plays', 'readwrite')
    const artists = ['Tycho', 'Tycho', 'Bonobo', 'Nujabes', 'Tycho', 'Four Tet', 'Bonobo', 'Caribou']
    const genres = ['Electronic', 'Electronic', 'Electronic', 'Hip-Hop/Rap', 'Electronic', 'Electronic', 'Electronic', 'Dance']
    for (let i = 0; i < 26; i++)
      tx.objectStore('plays').add({ trackId: i, artist: artists[i % 8], genre: genres[i % 8], at: Date.now() - (i % 7) * 864e5 - i * 6e5 })
    await new Promise((res) => (tx.oncomplete = res))
  })
  await p.goto(`${BASE}/app/library`)
  await p.waitForLoadState('networkidle')
  await p.waitForTimeout(1200)
  await p.screenshot({ path: docs('library') })

  await p.goto(`${BASE}/app/search?q=tycho&tab=albums`)
  await p.waitForLoadState('networkidle')
  await p.waitForTimeout(1500)
  await p.screenshot({ path: docs('search') })
  await p.getByRole('link', { name: /^Dive/ }).first().click()
  await p.getByRole('heading', { level: 1 }).waitFor()
  await p.waitForLoadState('networkidle')
  await p.waitForTimeout(1200)
  await p.screenshot({ path: docs('album') })
  await p.getByRole('button', { name: 'Play previews' }).click()
  await p.waitForTimeout(3500)
  // Through the app, so the queue survives.
  await p.getByRole('link', { name: 'Open now playing' }).click()
  await p.waitForTimeout(3000)
  await p.screenshot({ path: docs('now-playing') })

  await p.goto(`${BASE}/app/galaxy`)
  await p.locator('canvas').waitFor({ timeout: 15_000 })
  await p.waitForLoadState('networkidle')
  await p.waitForTimeout(3000)
  await p.screenshot({ path: docs('galaxy') })

  await p.goto(`${BASE}/app/quiz`)
  await p.getByRole('group', { name: 'Answers' }).waitFor({ timeout: 30_000 })
  await p.getByRole('button', { name: /Show another clue/ }).click()
  await p.waitForTimeout(400)
  await p.screenshot({ path: docs('quiz') })
  await ctx.close()
}

// Light theme and phone.
{
  const { ctx, p } = await open({ colorScheme: 'light' }, { theme: 'light' })
  await dj(p)
  await p.screenshot({ path: docs('dj-light') })
  await ctx.close()
}
{
  const { ctx, p } = await open({ ...devices['Pixel 7'] })
  await p.goto(`${BASE}/`)
  await p.waitForTimeout(2000)
  await p.screenshot({ path: docs('mobile-landing') })
  await dj(p)
  await p.getByRole('list', { name: 'Playlist' }).evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 180))
  await p.waitForTimeout(800)
  await p.screenshot({ path: docs('mobile-dj') })
  await ctx.close()
}

await browser.close()
