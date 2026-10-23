# Willify design brief

Made with the `awwwards` MCP (`search_sites`, `get_site_details`, `create_design_brief`) on 2026-10-23. We take ideas from these sites; we copy none of them.

## References

| Site | Award | What we take |
| --- | --- | --- |
| [Overworld Audio](https://overworldaudio.com/) | SOTD (Oct 2026) | A sound studio's work shown as an explorable night map, with glowing markers you click to hear. Our genre galaxy is the same idea: a dark, foggy world where every light is a sound. |
| [penguin.music](https://penguin.music/) | Honorable Mention | Lighting that reacts to the playing song in real time, and a sky that changes with the genre. Our galaxy's light and the app's accent colour follow the playing preview and its genre. |
| [Byotōne](https://byotone.com) | Honorable Mention | Small mono HUD labels pinned around the hero ("7.5–14 Hz", "DELTA") and a frequency slider. We pin genre names, BPM-feel and "30s PREVIEW · ITUNES" labels the same way. |
| [Ascension, Pegassi](https://ascension.pegassi.be/) | SOTD + Developer | A record release told like a record sleeve: A-side / B-side, credits in the corner, one huge chrome word. Our playlists read like sleeves, with side A / side B and liner notes. |
| [VYBE Art](https://www.vybe.art) | Nominee | A prompt box right in the hero and a "NOW PLAYING" ticker along the bottom edge. Our hero has the vibe box, and a ticker shows what the galaxy is playing. |

## The idea: the galaxy is a record

Seen from above, a spiral galaxy looks like a vinyl record: arms that wind in towards a bright centre, like grooves towards the label. Willify uses that as its signature. Every genre is a star on one of the spiral arms; neighbouring genres sit close (lo-fi next to jazz hop, next to soul). The centre of the galaxy is the label of the record, and it is where your playlist lives.

The groove is the second motif. A playlist is drawn as one groove line, a slow spiral or a long curve, with each track as a point on it, and a needle that moves along it as the previews play. Refining the playlist ("more energy") bends the groove: new tracks slide in, dropped ones fade out of the line.

It keeps the old app's promise ("search a song, play it instantly") and turns it into a place you explore.

## Palette

Deep space and one sleeve-paper light theme. Colour comes from the music: the accent shifts gently towards the playing track's artwork colour (taken from iTunes artwork, clamped so contrast never drops below AA).

Dark ("space", default):

| Token | Hex | Use |
| --- | --- | --- |
| `--bg` | `#09080F` | space, a touch of violet |
| `--surface` | `#13121C` | cards, the player bar |
| `--line` | `#2A2838` | grooves, borders |
| `--text` | `#F1EEF8` | body text (17.4:1 on bg) |
| `--muted` | `#A8A3BC` | secondary text (8.2:1 on bg) |
| `--accent` | `#8F72FF` | violet: primary buttons (space-black text on it, 5.7:1), the needle, focus rings (5.7:1 on bg) |
| `--accent-2` | `#6CF2C2` | aurora mint: "playing" state, levels, the live waveform (14.4:1 on bg) |
| `--warn` | `#FF6A7D` | errors, thumbs-down (7.2:1 on bg) |

Light ("sleeve"): `--bg #F3F0EA`, `--surface #FFFFFF`, `--text #15131D` (16.2:1), `--muted #5A566A` (6.2:1), `--accent #5B3FE0` (5.7:1; white text on it 6.5:1), `--accent-2 #0B7A5A` (4.7:1), `--warn #C0283F` (5.1:1).

Contrast is checked by axe in both themes in CI.

## Type

- Display: **Bricolage Grotesque** variable (width, weight and optical size axes). On the landing page the headline's width axis breathes with the playing preview, so the words pulse with the beat. With reduced motion it stays still.
- UI and body: **Inter Tight** variable.
- Labels, track numbers, durations and the HUD tags: **JetBrains Mono**, uppercase 11px, wide tracking ("SIDE A · 08 TRACKS · 30S PREVIEWS").
- All self-hosted, Latin subsets only, preloaded only where Lighthouse allows.

## Motion

- **Hero galaxy (React Three Fiber + drei):** about 6,000 points in a four-armed spiral, one draw call, with 40 brighter genre stars and their names as HTML labels. It turns slowly; the pointer tilts it. Press play on the hero and a short preview plays: the Web Audio analyser drives the stars' size and the core's glow, and the active genre's arm lights up. On phones, slow GPUs or reduced motion it is the Flow still (and the 8s clip on wide screens without WebGL), loaded after first paint, like the other EW apps.
- **Scroll story (GSAP ScrollTrigger + Lenis):** one pinned section, four beats: _describe_ (a vibe types itself into the box) → _listen_ (tracks drop onto a groove, the needle starts) → _refine_ ("more energy" bends the groove, two tracks swap) → _share_ (the playlist folds into a sleeve with liner notes and an Apple Music link). Each beat has a Flow illustration and a live mini demo.
- **App (Motion):** tracks slide onto the groove with a 40ms stagger; 👍 pulses mint, 👎 drops the track out of the line; the player bar's waveform is live from the analyser. Previews crossfade over 1.5s through Web Audio gain nodes. No scroll-jacking inside the app.
- **Now playing:** a full-screen visualiser, a ring of bars around the artwork that ripple outward like grooves, coloured from the artwork. Title, artist, "Listen on Apple Music" and "Previews courtesy of iTunes" stay on screen at all times.
- `prefers-reduced-motion`: no Lenis, no scrub, no galaxy spin, no visualiser (a still artwork view instead), no font pulsing; the same content and keyboard access.

## Layout, page by page

- **Landing `/`:** hero (galaxy full-bleed, headline "Describe the moment. Hear it." bottom-left, the vibe box under it, HUD genre tags around the edges, a NOW PLAYING ticker along the bottom) → pinned four-beat story → "why it's different" bento (real tracks only, checked against iTunes; no account, no Premium; thumbs steer it; the galaxy; your week in music) → a strip of example vibes you can tap → pricing teaser → developer card → footer "Made with ♥ by EWSTUDIOS".
- **Vibe DJ `/app`:** a large vibe box at the top with example chips. Below it the playlist as a sleeve: title and AI liner notes on the left, the groove of tracks on the right (artwork from iTunes, title, artist, a "why this fits" line, 👍/👎, play, Apple Music link). Refine chips under the list: "more energy", "less vocals", "more like #3", "older", "newer", plus free text. A small line says how many suggestions were dropped because they don't exist on iTunes. Save to library, export.
- **Search `/app/search`:** one field, tabs for songs, artists, albums. Results are dense rows with artwork. **Artist** and **album** pages open as sleeves: big artwork, the track list, Apple Music link.
- **Galaxy `/app/galaxy`:** the 3D galaxy full-screen with the genre stars. Click or press Enter on a star to hear three example previews and see the genre's neighbours. A "List view" toggle shows the same genres as a keyboard-friendly list grouped by arm (it is also the default with reduced motion or no WebGL). Arrow keys move between neighbouring stars.
- **Library `/app/library`:** playlists as a grid of sleeves (a collage of four iTunes covers each) plus Liked songs. "Your week in music" card: plays this week, top artists, top genre, from local plays only. Export a playlist as text or CSV with Apple Music links.
- **Quiz `/app/quiz`:** see the compliance note below; the layout is a big round card, a timer ring, four answer buttons, a streak counter, and the daily challenge at the top.
- **Now playing `/app/now-playing`:** the full-screen visualiser above; the queue slides up from the bottom.
- **Player bar (all app pages):** artwork, title, artist, play/pause, next, a 30s progress ring, the live waveform, the Apple Music link, and "Previews courtesy of iTunes". Media Session for lock-screen and headphone controls.
- **Developer, Pro, Settings, Privacy, Terms:** shared EW layouts with Willify's colours. The developer page shows the owner's character with headphones at a turntable.
- **404:** a record with the needle skipping in a broken groove: "This track skipped." with links home and to the DJ.

## Assets (from Flow, project "Revamp")

Hero galaxy still + 8s clip (a spiral galaxy that reads as a vinyl record from above, violet and mint light); one illustration per mode (DJ, galaxy, library, quiz); four empty states (no playlist yet, empty library, no search results, no liked songs); OG image; the developer portrait and loop with the owner's character (the only place it appears). Style for all: soft 3D, deep space violet with mint light, matte black vinyl, unbranded devices and headphones, no readable fake text, no fake album covers. Logo and icons are SVG, drawn by hand: the mark is a **W drawn as one groove line that winds into a record's centre**, refreshing the old light and dark icons.

## Apple terms that shape the design

From Apple's [Search API page](https://performance-partners.apple.com/search-api) and the [Apple Music identity guidelines](https://marketing.services.apple/apple-music-identity-guidelines), read 2026-10-23:

- Previews and artwork are promotional content: "only to promote store content and not for entertainment purposes". They must sit next to a link where people can get the music, and say they are provided courtesy of iTunes. So every track row, the player bar and now playing carry an Apple Music link and "Previews courtesy of iTunes".
- Previews are streamed, never downloaded, saved or cached. The service worker will not cache `audio-ssl.itunes.apple.com` or artwork; the API caches only the JSON from search and lookup, which Apple asks large sites to do.
- About 20 calls a minute, so every call goes through ew-apps-api with a cache.
- Badges: only Apple's own "Listen on Apple Music" artwork, unaltered, at least 30px high (12px for small badges), with clear space, one badge per page; the Apple Music icon for per-track links. We need to download Apple's official SVG from its marketing tools.
- The previews' servers send `Access-Control-Allow-Origin: *`, so the Web Audio analyser works on Apple's URLs directly, with no proxy and no re-hosting.

Open questions for the owner are in the hand-over message: the quiz, the visualiser and artwork size.
