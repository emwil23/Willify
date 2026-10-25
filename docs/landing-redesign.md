# Willify landing redesign: "Drop the needle"

Owner's ask (2026-10-24): redesign only the landing page (`/`) into an Awwwards-level music experience, with free-flowing graphics and smooth animation, after studying at least three of the best sites. The app pages stay as they are.

## Why it changed

The first landing shared its skeleton with the other EW apps: a dark background, a mono eyebrow chip, a huge two-line headline with a coloured second line, a paragraph, an input pill, a bottom marquee and a 3D object on the right. It read as a template, not as music.

## References

Studied on 2026-10-24 with the `awwwards` MCP (`search_sites`, `get_site_details`) and our own Playwright recordings of each live site (scroll frames, pointer moves, a check for GSAP, ScrollTrigger, Lenis and WebGL). The MCP's motion tools needed a global Playwright install, so the motion notes come from those recordings.

| Site                                                                             | Award            | Built with                               | What we take                                                                                                                                                                                 | What we leave                                 |
| -------------------------------------------------------------------------------- | ---------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [Spotify Wrapped Party](https://wrapped-party.activetheory.dev) by Active Theory | SOTD, Jul 2026   | WebGL, GSAP                              | Op-art concentric rings that read as a record, one hand-drawn line wandering across the page like a waveform, light paper ground with one loud colour. Music made graphic, not photographic. | The lime, the outlined numerals, the QR gate. |
| [No Art](https://www.noartmusic.com/)                                            | SOTD, Aug 2026   | GSAP + ScrollTrigger, Lenis, WebGL globe | Crop marks framing the viewport, tiny mono labels as instrument readouts, justified uppercase statements with wide word spacing, a list of destinations that reveals media on hover.         | Their editorial poster grid and globe.        |
| [Indigo Laboratory](https://indigo-laboratory.it/)                               | SOTD, Jun 2026   | Curtains.js (WebGL), Lenis               | Sound as an opt-in choice ("with sound" / "continue without"), and a list of sound words set as one tall typographic stack.                                                                  | The full-screen gate before the content.      |
| [Ascension, Pegassi](https://ascension.pegassi.be/)                              | SOTD + Developer | WebGL, Lenis                             | A record sleeve as the interface: the vinyl slides out of its sleeve to reveal what's inside.                                                                                                | The single-release, click-to-enter structure. |

## The concept: drop the needle

The whole page is a record you play by scrolling.

1. **The groove field (hero).** A full-screen WebGL shader of fine concentric grooves, a record seen from very close, with one bright waveform flowing through it. The pointer drops a ripple into the grooves wherever it moves. Tap **Listen** and today's most-played song starts; the grooves and the waveform move with the real audio through the Web Audio analyser. The player card shows the artwork, Apple's "Listen on Apple Music" badge and "Previews courtesy of iTunes" while it plays.
2. **The sentence (entry point).** No input pill. The headline is the input: "Tonight sounds like ___." in huge type, where the blank is a real text field, typed into in place, with example vibes typing themselves in as the placeholder. Enter starts the DJ. The headline's weight and width lean towards the pointer (variable font axes), so the type itself is kinetic without ever hiding the LCP text.
3. **Side A (how it works).** Four record sleeves on a horizontal track pinned to the scroll: Describe, Listen, Refine, Share. As each sleeve reaches the centre, its vinyl slides out with the step's copy. On phones it becomes a vertical stack where each record slides out as it scrolls into view.
4. **Real songs only.** The point no other AI DJ makes: a list of real AI suggestions from the Gemini run in this repo is checked line by line as you scroll. Real songs get a mint "on iTunes" stamp; the two made-up ones are struck through in red. The headline beside it lights up word by word.
5. **The galaxy is a record.** One big record whose grooves are the 38 genre names set on circular paths, one ring per arm, spinning with the scroll and faster with scroll speed.
6. **Four doors.** The modes as a justified uppercase list (DJ, Galaxy, Library, Quiz) with index numbers; on hover the mode's artwork floats beside the pointer.
7. **Drop the needle.** A closing sentence form, the price line, the developer card and the footer.

Crop marks hold the viewport edges, and mono readouts at the corners (Side A, 33⅓ rpm, a live level meter) behave like a deck's display.

## Type, colour and motion

- Type: Bricolage Grotesque variable (weight, width, optical size) for the sentence and statements; JetBrains Mono for readouts; Inter Tight for body. All already self-hosted.
- Colour follows the theme. Light (sleeve paper): ink grooves on paper with violet and mint. Dark: paper-coloured grooves on ink. The shader reads the CSS tokens, so both themes match the app.
- Motion: GSAP 3.15 (ScrollTrigger, SplitText; free under GSAP's standard licence since 2025) with Lenis smooth scroll, and one raw WebGL fragment shader for the groove field, about 4 kB, no three.js on this page. The 3D galaxy stays in the app.
- `prefers-reduced-motion`: no WebGL, no pinning, no smooth scroll, no kinetic type. A static CSS groove pattern and every section fully visible.

## Quality bar

- Lighthouse ≥ 95 on phones: the headline text is the LCP element and paints from the prerendered HTML; the shader starts after first paint, only with a real GPU, and pauses off screen.
- axe clean in both themes; every control keyboard operable; the decorative layers are hidden from assistive tech; no layout shift (fixed-size canvas, reserved heights).
- Existing tests keep passing; a new landing test covers the sentence form, the real-songs list and the doors.
