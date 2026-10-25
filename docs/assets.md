# Willify assets

Generated in Google Flow on 2026-10-23 (the stills and the galaxy clip in the project that was open in the Flow window; the developer portrait is made in project "Revamp", which holds the owner's `master` image): stills with **Nano Banana Pro** (0 credits) and clips with **Omni 1.1 Flash** (720p). The owner's character (the `master` image in the project) appears only on the developer page. Album artwork in the app always comes from iTunes, credited; no image here is ever shown as a cover.

Shared style line: soft 3D render, deep space black, violet (#8F72FF) and aurora mint (#6CF2C2) light, matte black vinyl, unbranded devices, no text, no logos.

| File (public/media)                                     | Used on                             | Prompt (short)                                                                                            |
| ------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `mode-dj.webp`                                          | Landing, Vibe DJ card               | An unbranded turntable floating in space whose record is a glowing spiral galaxy, needle on one arm       |
| `mode-galaxy.webp`                                      | Landing, galaxy card                | Glowing stars in different hues along a spiral arm, joined by light trails like a constellation map       |
| `mode-library.webp`                                     | Landing, library card               | A shelf of blank gradient record sleeves, one pulled forward with a black vinyl peeking out               |
| `mode-quiz.webp`                                        | Landing, quiz card                  | A black vinyl with a glowing question mark above its label and three spark "clues" orbiting               |
| `empty-playlist.webp`                                   | DJ and now playing, nothing yet     | An empty glowing platter with a faint spiral of stardust above it                                         |
| `empty-library.webp`                                    | Library, no playlists               | An empty record crate with a violet glow and mint dust                                                    |
| `empty-search.webp`                                     | Search, nothing typed or found      | A glowing magnifying glass drifting over spiral star trails                                               |
| `empty-likes.webp`                                      | Library, no liked songs             | A faint heart of tiny stars above a black vinyl                                                           |
| `og.jpg`                                                | Social share image (1200×630)       | A galaxy-record on the right with a tonearm and a mint spark; the title and logo are added on top in code |
| `developer.webp`                                        | Developer page, landing card        | The owner's character in large unbranded headphones at a turntable, smiling (reference: `asset:master`)   |
| `developer-loop.mp4` / `.webm`, `developer-poster.webp` | Developer page (6s, cropped to 3:4) | The same character nodding to the music, scratching lightly, then smiling at the camera                   |
| `listen-on-apple-music.svg`                             | Player bar, now playing             | Apple's official badge, downloaded unaltered from Apple's marketing tools (tools.applemediaservices.com)  |

The first landing page also used a galaxy still and an 8s galaxy clip (12 credits); the redesigned landing (docs/landing-redesign.md) draws its hero in a shader instead, so those files were removed. Flow keeps them.

## Processing

- Flow marks each output with a small sparkle in the bottom-right corner; every still and clip is cropped to its top-left 90% to leave it out.
- Stills: Pillow, WebP quality 78. Clips: `ffmpeg`, H.264 (`+faststart`) and VP9, no audio; posters are each clip's own first frame.
- Fonts: Bricolage Grotesque (weight, width and optical-size axes) subset to basic Latin with fontTools (`pyftsubset`, 131 kB → 78 kB); Inter Tight and JetBrains Mono as in the other EW apps.
- Logo, favicon and PWA icons: hand-drawn SVG (`public/favicon.svg`, `src/components/Logo.tsx`), rendered to PNG with Playwright.
- The downloaded originals in `E:\flow-mcp-out\willify` are deleted once the optimised files are in the repo; Flow keeps every original.
