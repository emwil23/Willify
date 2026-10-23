import { cn } from '@/lib/cn'

/** The Willify mark: a record whose groove is drawn as one W, running into the label at the centre. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden="true">
      <circle cx="16" cy="16" r="15.5" fill="#09080f" />
      <circle cx="16" cy="16" r="12.5" fill="none" stroke="#2a2838" strokeWidth="0.75" />
      <circle cx="16" cy="16" r="9.5" fill="none" stroke="#2a2838" strokeWidth="0.75" />
      <path
        d="M6.5 11.5 10.4 21.5 14 13.5 17.6 21.5 21.4 11.5 C23.5 6 27.5 12.5 24 17"
        fill="none"
        stroke="#8f72ff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="2.2" fill="#6cf2c2" />
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
