import type { ReactNode } from 'react'

function Page({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <article className="[&_h2]:font-display [&_p]:text-muted [&_ul]:text-muted mx-auto max-w-3xl px-6 pt-36 pb-28 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-3xl [&_h2]:font-semibold [&_li]:mt-2 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
      <p className="spec text-accent-text">Last updated {updated}</p>
      <h1 className="font-display mt-4 text-6xl font-bold">{title}</h1>
      {children}
    </article>
  )
}

const link = 'text-accent-text underline'

export function Privacy() {
  return (
    <Page title="Privacy" updated="23 October 2026">
      <p>
        The short version: your playlists, likes and listening stay on your device. We don't run
        ads, trackers or analytics.
      </p>

      <h2>What stays on your device</h2>
      <p>
        Playlists, liked songs, quiz scores, the plays behind “Your week in music” and your settings
        are stored in your browser (IndexedDB and local storage). Clearing your browser data deletes
        them.
      </p>

      <h2>Music search and previews</h2>
      <p>
        Searches go through our server (ew-apps-api) to Apple's iTunes Search API, so that Apple's
        rate limit can be shared fairly and answers cached. Apple sees the search words and the
        store country, not who you are. Previews and artwork then load straight from Apple's
        servers, which see your IP address like any website would. Apple Music links open Apple's
        site under{' '}
        <a className={link} href="https://www.apple.com/legal/privacy/">
          Apple's privacy policy
        </a>
        ; they may carry our affiliate tag, which tells Apple the visit came from Willify.
      </p>

      <h2>When you use the AI</h2>
      <p>
        You choose the provider in Settings. The AI only ever sees the vibe you typed, refine
        instructions, and song titles and artists. Nothing personal is sent.
      </p>
      <ul>
        <li>
          <strong>Willify AI (free)</strong> runs through our server on Google's Gemini API free
          tier.{' '}
          <strong>
            Google may read and use prompts sent on the free tier to improve its products
          </strong>
          , so don't put personal or sensitive details in a vibe. You sign in with an email code or
          a passkey (Supabase) so we can count your daily calls; we store your email, a user id, the
          date you confirmed you're 18 or over, a per-day call count and, if you add one, your
          passkey's public key. Nothing else. You can delete all of it any time from Settings. This
          option is not offered in the EEA, the UK or Switzerland, or to anyone under 18.
        </li>
        <li>
          <strong>Puter</strong>, <strong>OpenRouter</strong> and <strong>your own key</strong> send
          requests straight from your browser to that service, under its own privacy policy. Keys
          are stored only in your browser.
        </li>
      </ul>

      <h2>Our server</h2>
      <p>
        Our API logs the time, route and status of requests to keep it running, and uses your IP
        address in memory to apply rate limits and the region rule. Search answers are cached in
        memory for up to a day. We don't sell or share data.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or deletion requests: reach Emmanuel via{' '}
        <a className={link} href="https://emmanuelwilson.tech">
          emmanuelwilson.tech
        </a>
        .
      </p>
    </Page>
  )
}

export function Terms() {
  return (
    <Page title="Terms" updated="23 October 2026">
      <p>
        Willify is open-source software provided as is, without warranty. By using it you agree to
        these terms.
      </p>
      <h2>Music, previews and artwork</h2>
      <p>
        Willify doesn't own, host or store any music. Song details, 30-second previews and album
        artwork come from Apple's iTunes Search API and stream from Apple's servers; previews are
        courtesy of iTunes and are there to help you find music to listen to on Apple Music. Apple
        Music, iTunes and the Apple Music badge are trademarks of Apple Inc. Willify isn't made,
        sponsored or endorsed by Apple. Willify never shows lyrics.
      </p>
      <h2>Your library</h2>
      <p>
        Your playlists live on your device. You are responsible for backing them up (export them as
        CSV or text).
      </p>
      <h2>The AI</h2>
      <p>
        The AI's notes and clues can be wrong. Every song it suggests is checked against iTunes, but
        a match can still be a different recording. Fair-use limits apply to the free AI server, and
        we may change or pause it.
      </p>
      <h2>Pro</h2>
      <p>
        When Pro launches, its price and refund rules will be shown at checkout. Pro never unlocks
        the AI itself; that stays free.
      </p>
      <h2>Licence</h2>
      <p>
        The source code is MIT-licensed. The Willify name, logo and character artwork belong to
        EWSTUDIOS.
      </p>
    </Page>
  )
}
