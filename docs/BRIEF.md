# Willify: build brief (approved by the owner 2026-10-22)

Read `D:\Code\AIPro\AIPro\ew-apps\CLAUDE.md` first, plus the saved memory on EW apps infrastructure and TaskPilot lessons. They all apply. **Start after Translate+ is done** (both use ew-apps-api and Flow, one session at a time). **Reuse the shared pieces from `../taskpilot`, `../pixe` and `../translateapp`** (Vite starter setup, AI-connect layer, auth with passkey + email code, Meet-the-developer page, CI, the Cloudflare Workers deploy setup) by copying them. Work on a new branch `revamp` from `master`, commit in small steps, push, and open a PR to `master`. Replace the CRA app entirely; keep git history. MusicSearchApp (github.com/emwil23/MusicSearchApp) is folded into this repo; leave that repo alone unless the owner asks.

## 1. What's there now
- **Willify:** React 17 CRA that searches Spotify and plays tracks through `react-spotify-web-playback`, so only Spotify Premium users can play. Login goes through a dead `willify.herokuapp.com` server.
- **MusicSearchApp:** a search box that only `console.log`s.
- Problems: Spotify client ID hard-coded in `Dashboard.js` and `Login.js`; album images have no alt text; clickable `div`s with no keyboard support; commented-out code; no tests.
- Keep: the name, the light and dark icons, and "search a song, play it instantly".

## 2. What we're making
**Willify: an AI music-discovery DJ.** Describe a moment ("rainy Sunday coding, lo-fi but not sleepy") and Willify builds a playlist of **real** tracks from the iTunes catalogue. Play 30-second previews at once, with no account and no Premium, and open any song in Apple Music.

Pages:
- `/`: landing with a 3D **genre galaxy** hero (genres as stars, pulsing to the music), scroll story *describe → listen → refine → share*, pricing teaser, footer "Made with ♥ by EWSTUDIOS".
- `/app`: the Vibe DJ. The AI suggests artist + title pairs; **each is checked against iTunes Search/Lookup in code and dropped if it doesn't exist**, so no made-up songs. A "why this fits" note per track. Refine with "more energy", "less vocals", "more like #3", and 👍/👎 per track.
- `/app/search`: songs, artists, albums, with artist and album pages.
- `/app/galaxy`: explore genres in 3D; click a star to hear examples. Keyboard operable, with a list view.
- `/app/library`: playlists and liked songs on the device; export as text or CSV with Apple Music links.
- `/app/quiz`: guess the song from a few seconds of preview; a daily challenge plus quizzes from your playlists.
- `/app/now-playing`: full-screen 3D visualiser of the playing preview.
- `/developer`, `/pro`, `/settings`, `/privacy`, `/terms`, a designed 404.

## 3. Taken from competitors
| From | Feature | In Willify |
|---|---|---|
| Spotify AI DJ / AI Playlist | Playlist from a prompt | Vibe DJ with checked tracks and "why this fits" |
| Apple Music | Editorial picks | "Open in Apple Music" on every track; AI-written mini liner notes |
| Every Noise at Once / Musicmap | A map of genres | The 3D genre galaxy |
| Last.fm | Listening stats | "Your week in music" from local plays |
| Pandora | Thumbs shaping a station | 👍/👎 steer the next suggestions |
| Music quiz games | Guess the song | Quiz mode from your playlists |

**AI actions** (shared route `/api/ai/willify/:action`): vibe → tracks, refine playlist, why this fits, liner notes, quiz hints.

## 4. Rules (required)
- **Before building, read Apple's terms** for the iTunes Search API and previews (Apple Media Services / Performance Partners) and follow them; note the findings in the PR.
- iTunes Search/Lookup needs no key but is limited to about 20 calls a minute, so all calls go through ew-apps-api (new `/api/music/*` routes) with caching.
- Stream previews only from Apple's URLs; never store or re-host audio or artwork. Every track links back to Apple Music.
- No lyrics (licensed).
- Free-tier Gemini may be read by Google: send only the vibe text and track names, never personal data.
- 18+ for the Gemini route; hidden for EU/UK/CH users (per CLAUDE.md). Fallback providers still work there.

## 5. Tech (all in)
- Same base as the other apps: React 19, strict TS, Vite, TanStack Router, Dexie, Zustand, Tailwind v4, shadcn/Radix, Motion, GSAP + Lenis, React Three Fiber + drei, PWA, CI with Lighthouse ≥ 95 and axe.
- Audio: Web Audio API for crossfades and an analyser driving the R3F visualiser; Media Session API for lock-screen and headphone controls. `prefers-reduced-motion` turns the visualiser off.
- Tests: unit tests for the "check AI tracks against iTunes" step and quiz scoring; Playwright for vibe → playlist → export.

## 6. Sign-in and hosting
- Passkey + email code (a passkey app per CLAUDE.md). Host at `willify.ewstudios.workers.dev`; add that origin to Supabase passkey origins, redirect URLs and `ALLOWED_ORIGINS` when deploying. The old GitHub Pages site (`emwil23.github.io/Willify`) can redirect there once the owner agrees.

## 7. Pro (gated through the shared entitlement)
Sync across devices, public playlist share links, a collaborative party room (Supabase Realtime), higher AI quota.

## 8. Design and assets
- Use the `awwwards` MCP for 3–5 references (music, audio-reactive 3D, record labels) and write docs/design-brief.md. Show the owner the direction before building the UI.
- Assets through the `flow` MCP (rules in CLAUDE.md). The owner's character appears **only** on the developer page. Assets:
  - hero: the genre galaxy, an 8s clip and a still
  - an illustration for each mode (DJ, galaxy, library, quiz)
  - 4 empty-state illustrations
  - OG image
- Album artwork in the app always comes from iTunes, credited; never AI art passed off as real covers.
- List assets in docs/assets.md. Delete downloaded originals after use. Draw the logo and icons as SVG (refresh the old icons).

## Done means
- All pages work and tests pass in CI.
- docs/design-brief.md and docs/assets.md exist.
- A showcase README (see CLAUDE.md) uses real screenshots.
- A PR is open.
- After the owner approves, deploy to its workers.dev address, then set the GitHub About section.

Don't deploy, rename the repo or spend anything without asking.
