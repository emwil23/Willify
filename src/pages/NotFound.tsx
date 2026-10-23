import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

/** A designed 404: a record with the needle stuck in a broken groove. */
export function NotFound() {
  return (
    <main
      id="main"
      className="stars grain relative grid min-h-dvh place-items-center overflow-hidden px-6 text-center"
    >
      <svg
        viewBox="0 0 400 400"
        className="pointer-events-none absolute top-1/2 left-1/2 w-[min(90vw,640px)] -translate-x-1/2 -translate-y-1/2 opacity-30"
        aria-hidden
      >
        <circle cx="200" cy="200" r="196" fill="var(--surface)" />
        {Array.from({ length: 14 }, (_, i) => (
          <circle
            key={i}
            cx="200"
            cy="200"
            r={70 + i * 9}
            fill="none"
            stroke="var(--line)"
            strokeDasharray={i === 7 ? '40 14 6 30' : undefined}
          />
        ))}
        <circle cx="200" cy="200" r="52" fill="var(--accent)" />
        <circle cx="200" cy="200" r="5" fill="var(--bg)" />
        <path
          d="M372 40 L300 150 L268 238"
          fill="none"
          stroke="var(--muted)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="268" cy="238" r="7" fill="var(--live)" />
      </svg>
      <div className="relative">
        <p className="spec text-accent-text">Error 404 · Skip</p>
        <h1 className="font-display mt-4 text-6xl font-extrabold [font-stretch:80%] md:text-9xl">
          This track skipped.
        </h1>
        <p className="text-muted mx-auto mt-4 max-w-md">
          The needle jumped a groove and landed nowhere. Let's put on something that exists.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="primary" size="lg">
            <Link to="/app">Ask the DJ</Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
