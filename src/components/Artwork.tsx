import { cn } from '@/lib/cn'
import { artworkAt } from '@/lib/music'
import { Disc3 } from 'lucide-react'
import { useState } from 'react'

/**
 * Album artwork from Apple's CDN: the larger size first, then the documented 100px original if that fails.
 * Never stored or re-hosted. Decorative by default, since the title and artist sit next to it.
 */
export function Artwork({
  src,
  size = 300,
  alt = '',
  className,
  eager = false,
}: {
  src: string | null
  size?: number
  alt?: string
  className?: string
  eager?: boolean
}) {
  const [fallback, setFallback] = useState(false)
  const [failed, setFailed] = useState(false)
  const url = fallback ? src : artworkAt(src, size)
  if (!url || failed)
    return (
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        className={cn('bg-surface-2 text-muted grid place-items-center', className)}
      >
        <Disc3 className="size-1/2" aria-hidden />
      </span>
    )
  return (
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => (fallback ? setFailed(true) : setFallback(true))}
      className={cn('bg-surface-2 object-cover', className)}
    />
  )
}
