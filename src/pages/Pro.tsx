import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'

export const PLANS = [
  { name: 'Monthly', price: '$2', per: '/month', note: 'Cancel any time' },
  { name: 'Yearly', price: '$15', per: '/year', note: 'Save 37%', featured: true },
  { name: 'Lifetime', price: '$29', per: 'once', note: 'Pay once, keep it' },
]

const FREE = [
  'The Vibe DJ, with every song checked against iTunes',
  'Instant 30-second previews; no account, no Premium',
  'Search, artist and album pages, and the 3D genre galaxy',
  'Unlimited playlists and likes on your device, export as text or CSV',
  'The daily quiz and “Your week in music”',
  'AI playlists, refining, liner notes and quiz clues (free, never paywalled)',
]
const PRO = [
  'Sync playlists and likes across your devices',
  'Public share links for playlists',
  'A party room: build a playlist together, live',
  'Higher daily AI quota',
  'One pass unlocks every EW app',
]

export function Pro() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-36 pb-28">
      <p className="spec text-accent-text">Willify Pro</p>
      <h1 className="font-display mt-4 max-w-3xl text-6xl leading-[0.95] font-extrabold [font-stretch:80%] md:text-8xl">
        Free to listen. Pro when you want it everywhere.
      </h1>
      <p className="text-muted mt-6 max-w-xl text-lg">
        Pro pays for the servers that sync and share. The AI stays free for everyone. Regional
        prices are available at checkout.
      </p>

      <ul className="mt-14 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <li
            key={p.name}
            className={cn(
              'rounded-3xl border p-6',
              p.featured ? 'border-accent-text bg-accent/5' : 'border-line bg-surface/50',
            )}
          >
            <p className="spec text-muted">{p.name}</p>
            <p className="mt-4">
              <span className="font-display text-6xl font-bold">{p.price}</span>
              <span className="text-muted"> {p.per}</span>
            </p>
            <p className="text-muted mt-2 text-sm">{p.note}</p>
            <Button className="mt-6 w-full" variant={p.featured ? 'primary' : 'secondary'} disabled>
              Coming soon
            </Button>
          </li>
        ))}
      </ul>

      <div className="mt-16 grid gap-10 md:grid-cols-2">
        <FeatureList title="Free, forever" items={FREE} />
        <FeatureList title="Pro adds" items={PRO} accent />
      </div>
      <p className="text-muted mt-12 text-sm">
        Checkout opens once the core app has been tested in the wild. Until then everything here is
        free.{' '}
        <Link to="/app" className="text-accent-text underline underline-offset-4">
          Make a playlist
        </Link>
        .
      </p>
    </div>
  )
}

function FeatureList({
  title,
  items,
  accent,
}: {
  title: string
  items: string[]
  accent?: boolean
}) {
  return (
    <section>
      <h2 className="font-display mb-4 text-3xl font-semibold">{title}</h2>
      <ul className="flex flex-col gap-3">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-3">
            <Check
              className={cn('mt-0.5 size-4 shrink-0', accent ? 'text-accent-text' : 'text-muted')}
              aria-hidden
            />
            {i}
          </li>
        ))}
      </ul>
    </section>
  )
}
