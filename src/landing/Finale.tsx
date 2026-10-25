import { PLANS } from '@/pages/Pro'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { VibeSentence } from './Hero'

/** The last groove: one more chance to drop the needle, the price line and who made it. */
export function Finale({ reduce }: { reduce: boolean }) {
  return (
    <section aria-labelledby="finale-h" className="groove-static relative overflow-hidden">
      <div className="from-bg via-bg/90 to-bg/70 absolute inset-0 bg-gradient-to-b" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-6 py-32 sm:px-10">
        <h2
          id="finale-h"
          className="font-display text-[clamp(3.6rem,13vw,12rem)] leading-[0.82] font-extrabold tracking-[-0.03em] [font-stretch:76%]"
        >
          Drop the
          <br />
          <span className="text-accent-text">needle.</span>
        </h2>
        <div className="mt-12 max-w-2xl">
          <label htmlFor="finale-vibe" className="spec text-muted mb-3 block">
            Tonight sounds like…
          </label>
          <VibeSentence id="finale-vibe" compact reduce={reduce} />
        </div>

        <div className="border-line mt-24 grid gap-10 border-t pt-10 md:grid-cols-2">
          <div>
            <p className="spec text-muted">Free to listen</p>
            <p className="mt-3 text-lg">
              Everything here is free, AI included. Pro adds sync, share links and party rooms for
              every EW app, from <strong>{PLANS[0]?.price}</strong> a month.
            </p>
            <Link
              to="/pro"
              className="text-accent-text mt-4 inline-flex items-center gap-2 font-medium underline-offset-4 hover:underline"
            >
              Compare plans <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <Link to="/developer" className="group flex items-center gap-5">
            <img
              src="/media/developer.webp"
              alt="Emmanuel's 3D character wearing headphones at a turntable"
              width={112}
              height={140}
              loading="lazy"
              className="h-35 w-28 shrink-0 rounded-xl object-cover"
            />
            <span>
              <span className="spec text-muted block">Built by</span>
              <span className="font-display mt-1 block text-3xl font-bold group-hover:underline">
                Emmanuel Wilson
              </span>
              <span className="text-muted mt-1 block text-sm">
                Designer-developer behind EWSTUDIOS. Come and say hello.
              </span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
