import { cn } from '@/lib/cn'
import { appleMusicUrl } from '@/lib/music'
import { ArrowUpRight } from 'lucide-react'

/**
 * Apple's own "Listen on Apple Music" badge, unaltered (from Apple's marketing tools). Apple's terms ask
 * for previews to sit next to a badge that links to the music, at least 30px high, one per page.
 */
export function AppleMusicBadge({ url, className }: { url: string; className?: string }) {
  return (
    <a
      href={appleMusicUrl(url)}
      target="_blank"
      rel="noopener"
      className={cn('inline-block shrink-0', className)}
    >
      <img
        src="/media/listen-on-apple-music.svg"
        alt="Listen on Apple Music"
        width={110}
        height={32}
        className="h-8 w-auto"
      />
    </a>
  )
}

/** A plain text link for each song. Apple's marks are only used through the official badge. */
export function AppleMusicLink({
  url,
  label,
  className,
}: {
  url: string
  label: string
  className?: string
}) {
  return (
    <a
      href={appleMusicUrl(url)}
      target="_blank"
      rel="noopener"
      aria-label={label}
      className={cn(
        'text-muted hover:text-text inline-flex items-center gap-0.5 text-xs whitespace-nowrap',
        className,
      )}
    >
      Apple Music <ArrowUpRight className="size-3" aria-hidden />
    </a>
  )
}

/** The credit Apple asks for wherever previews play. */
export function ItunesCredit({ className }: { className?: string }) {
  return <p className={cn('spec text-muted', className)}>Previews courtesy of iTunes</p>
}
