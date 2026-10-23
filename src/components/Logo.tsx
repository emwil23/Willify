import { cn } from '@/lib/cn'

/** The Willify mark: a record whose groove is drawn as one W, its middle peak landing on the label. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden="true">
      <circle cx="16" cy="16" r="15.5" fill="#09080f" />
      <circle cx="16" cy="16" r="12.5" fill="none" stroke="#2a2838" strokeWidth="0.75" />
      <circle cx="16" cy="16" r="9.5" fill="none" stroke="#2a2838" strokeWidth="0.75" />
      <path
        d="M6.5 10 10.8 22 16 15 21.2 22 25.5 10"
        fill="none"
        stroke="#8f72ff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="15" r="2.6" fill="#6cf2c2" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className="font-display text-xl leading-none font-bold tracking-tight [font-stretch:85%]">
        Willify
      </span>
    </span>
  )
}
