import { LoopVideo } from '@/components/LoopVideo'
import { Button } from '@/components/ui/button'
import { Story } from '@/landing/Story'
import { useSmoothScroll } from '@/landing/useSmoothScroll'
import { prerendered, useReducedMotionSafe } from '@/lib/boot'
import { cn } from '@/lib/cn'
import { Quiet, useCan3D } from '@/lib/use3d'
import { PLANS } from '@/pages/Pro'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, BadgeCheck, Gauge, Headphones, Orbit, Sparkles, ThumbsUp } from 'lucide-react'
import { motion } from 'motion/react'
import { lazy, Suspense, useId, type ReactNode } from 'react'

const GalaxyScene = lazy(() => import('@/components/GalaxyScene'))

// Example vibes, the same ones the DJ suggests. A tap starts the DJ with it.
const VIBES = [
  'Rainy Sunday coding, lo-fi but not sleepy',
  'Golden hour drive along the coast',
  'Cooking dinner with friends, 70s soul',
  'Late-night train through a neon city',
  'First run of spring, upbeat but not cheesy',
  'Reading in a café, soft jazz and bossa nova',
  'Getting ready for a night out, 2000s R&B',
  'Snowy cabin, acoustic and warm',
]

const HUD = [
  { text: 'Lo-fi · Arm 2', className: 'top-[22%] right-[8%]' },
  { text: 'Afrobeats · Arm 1', className: 'top-[60%] right-[3%]' },
  { text: 'Shoegaze · Arm 3', className: 'bottom-[16%] right-[34%]' },
  { text: '40 genres · 4 arms', className: 'top-[14%] right-[30%]' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export function Landing() {
  const reduce = useReducedMotionSafe()
  const can3D = useCan3D(reduce)
  useSmoothScroll(!reduce)
  return (
    <>
      <Hero can3D={can3D} />
      <Story animate={!reduce} />
      <Different />
      <Modes reduce={reduce} />
      <Pricing />
      <DeveloperCard />
    </>
  )
}

function Hero({ can3D }: { can3D: boolean }) {
  const navigate = useNavigate()
  const inputId = useId()

  return (
    <section
      aria-labelledby="hero-h"
      className="grain relative flex min-h-dvh items-center overflow-hidden bg-[#09080f] pt-28 pb-24 text-[#f1eef8]"
    >
      {/* The galaxy still; on wide screens with a GPU the live 3D galaxy fades in over it. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <img
          src="/media/hero.webp"
          alt=""
          width={1376}
          height={768}
          fetchPriority="high"
          className={cn(
            'h-full w-full object-cover object-[70%_50%] transition-opacity duration-1000',
            can3D ? 'opacity-0' : 'opacity-80',
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09080f] via-[#09080f]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09080f] via-transparent to-[#09080f]/40" />
      </div>
      {can3D && (
        <div className="absolute inset-0 hidden md:left-[42%] md:block" aria-hidden>
          <Quiet>
            <Suspense fallback={null}>
              <GalaxyScene />
            </Suspense>
          </Quiet>
        </div>
      )}
      {HUD.map((h) => (
        <span
          key={h.text}
          className={cn(
            'spec pointer-events-none absolute hidden rounded border border-white/15 bg-black/30 px-2 py-1 text-white/60 backdrop-blur xl:block',
            h.className,
          )}
          aria-hidden
        >
          ▪ {h.text}
        </span>
      ))}

      <div className="relative mx-auto w-full max-w-6xl px-6">
        <motion.p
          custom={0}
          initial={prerendered ? false : 'hidden'}
          animate="show"
          variants={fadeUp}
          className="spec inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-white/70 backdrop-blur"
        >
          <span className="size-1.5 rounded-full bg-[#6cf2c2]" /> AI music DJ · real songs · free
        </motion.p>
        {/* Not animated in: it is the LCP element and must paint straight from the prerendered HTML. */}
        <h1
          id="hero-h"
          className="font-display breathe mt-6 max-w-3xl text-[clamp(3.2rem,9vw,7.5rem)] leading-[0.88] font-extrabold"
        >
          Describe the moment.
          <br />
          <span className="text-[#a48cff]">Hear it.</span>
        </h1>
        <motion.p
          custom={2}
          initial={prerendered ? false : 'hidden'}
          animate="show"
          variants={fadeUp}
          className="mt-6 max-w-xl text-lg text-white/75"
        >
          Willify turns a sentence into a playlist of real songs from the iTunes catalogue, checked
          one by one, and plays 30-second previews straight away. No account. No Premium.
        </motion.p>
        <motion.form
          custom={3}
          initial={prerendered ? false : 'hidden'}
          animate="show"
          variants={fadeUp}
          className="mt-8 flex max-w-xl flex-col gap-2 rounded-3xl border border-white/15 bg-black/40 p-2 backdrop-blur-md sm:flex-row sm:items-center sm:pl-5"
          // Works as a plain form before the app's JS has loaded (the page is prerendered).
          action="/app"
          method="get"
          onSubmit={(e) => {
            e.preventDefault()
            const v = new FormData(e.currentTarget).get('vibe')
            const vibe = typeof v === 'string' ? v.trim() : ''
            void navigate({ to: '/app', search: { vibe } })
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Describe a moment
          </label>
          <input
            id={inputId}
            name="vibe"
            required
            minLength={2}
            maxLength={300}
            placeholder={VIBES[0]}
            className="h-12 flex-1 bg-transparent px-3 text-base text-white outline-none placeholder:text-white/45 sm:px-0"
          />
          <Button type="submit" variant="primary" size="lg" className="bg-[#8f72ff] text-[#09080f]">
            <Sparkles /> Make my playlist
          </Button>
        </motion.form>
      </div>

      {/* A ticker of vibes along the bottom edge; each one starts the DJ. */}
      <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-white/10 bg-black/30 py-3 backdrop-blur">
        <p className="sr-only">Example vibes</p>
        <ul className="ticker flex w-max gap-8 whitespace-nowrap">
          {[...VIBES, ...VIBES].map((v, i) => (
            <li key={i} aria-hidden={i >= VIBES.length}>
              <Link
                to="/app"
                search={{ vibe: v }}
                tabIndex={i >= VIBES.length ? -1 : undefined}
                className="spec text-white/60 hover:text-white"
              >
                <span className="text-[#6cf2c2]">▶ Try</span> {v}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Card({
  icon,
  title,
  children,
  className,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <li className={cn('border-line bg-surface/60 rounded-3xl border p-6', className)}>
      <span className="text-accent-text [&_svg]:size-6" aria-hidden>
        {icon}
      </span>
      <h3 className="font-display mt-4 text-2xl font-semibold">{title}</h3>
      <p className="text-muted mt-2 text-sm leading-relaxed">{children}</p>
    </li>
  )
}

function Different() {
  return (
    <section aria-labelledby="diff-h" className="mx-auto max-w-6xl px-6 py-20">
      <p className="spec text-accent-text">Why it's different</p>
      <h2
        id="diff-h"
        className="font-display mt-3 max-w-3xl text-5xl leading-[0.95] font-bold [font-stretch:80%] md:text-6xl"
      >
        A DJ that can't make songs up.
      </h2>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        <Card icon={<BadgeCheck />} title="Real songs only" className="md:col-span-2">
          AI models sometimes invent songs. Willify looks every suggestion up in the iTunes
          catalogue and drops anything it can't find, so every track is real, playable and one tap
          from Apple Music.
        </Card>
        <Card icon={<Headphones />} title="No account, no Premium">
          Previews stream straight from Apple. Your playlists and likes stay in your browser.
        </Card>
        <Card icon={<ThumbsUp />} title="Thumbs steer it">
          Thumbs up keeps a song and finds more like it; thumbs down moves the next round away from
          it.
        </Card>
        <Card icon={<Orbit />} title="A galaxy of genres">
          Forty genres on four spiral arms, neighbours sounding alike. Click a star to hear it.
        </Card>
        <Card icon={<Gauge />} title="Your week in music">
          Plays, top artists and top genre, counted on your device and never sent anywhere.
        </Card>
      </ul>
    </section>
  )
}

const MODES = [
  {
    key: 'dj',
    to: '/app',
    title: 'Vibe DJ',
    body: 'Describe it, hear it, refine it.',
    alt: 'A glowing turntable whose record is a spiral galaxy',
  },
  {
    key: 'galaxy',
    to: '/app/galaxy',
    title: 'Genre galaxy',
    body: 'Fly between forty genres in 3D.',
    alt: 'Glowing stars arranged along the spiral arms of a galaxy',
  },
  {
    key: 'library',
    to: '/app/library',
    title: 'Library',
    body: 'Playlists as sleeves, likes, your week.',
    alt: 'A shelf of record sleeves lit in violet and mint',
  },
  {
    key: 'quiz',
    to: '/app/quiz',
    title: 'Name that song',
    body: 'A daily clue quiz from the charts.',
    alt: 'A record with a question mark of light above it',
  },
] as const

function Modes({ reduce }: { reduce: boolean }) {
  return (
    <section aria-labelledby="modes-h" className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <p className="spec text-accent-text">Four ways in</p>
          <h2
            id="modes-h"
            className="font-display mt-3 text-5xl leading-[0.95] font-bold [font-stretch:80%] md:text-6xl"
          >
            Pick a door.
          </h2>
        </div>
        <LoopVideo
          src="/media/hero"
          poster="/media/hero-poster.webp"
          label="A spiral galaxy turning slowly, seen from above like a record"
          reduce={reduce}
          className="hidden aspect-video w-72 rounded-2xl object-cover md:block"
        />
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODES.map((m) => (
          <li key={m.key}>
            <Link
              to={m.to}
              className="group border-line bg-surface/60 hover:border-accent-text block overflow-hidden rounded-3xl border transition-colors"
            >
              <img
                src={`/media/mode-${m.key}.webp`}
                alt={m.alt}
                width={600}
                height={600}
                loading="lazy"
                className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="p-5">
                <h3 className="font-display text-2xl font-semibold">{m.title}</h3>
                <p className="text-muted mt-1 text-sm">{m.body}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Pricing() {
  return (
    <section aria-labelledby="pricing-h" className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="spec text-accent-text">Pricing</p>
          <h2
            id="pricing-h"
            className="font-display mt-3 text-5xl font-bold [font-stretch:80%] md:text-6xl"
          >
            Free to listen.
          </h2>
          <p className="text-muted mt-4 max-w-md">
            Everything above is free, AI included. Pro adds sync, share links and party rooms, for
            all EW apps at once.
          </p>
        </div>
        <Button asChild>
          <Link to="/pro">
            Compare plans <ArrowRight />
          </Link>
        </Button>
      </div>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <li
            key={p.name}
            className={cn(
              'rounded-3xl border p-6',
              p.featured ? 'border-accent-text bg-accent/5' : 'border-line',
            )}
          >
            <p className="spec text-muted">Pro · {p.name}</p>
            <p className="mt-3">
              <span className="font-display text-5xl font-bold">{p.price}</span>{' '}
              <span className="text-muted">{p.per}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function DeveloperCard() {
  return (
    <section aria-labelledby="dev-h" className="mx-auto max-w-6xl px-6 pb-28">
      <Link
        to="/developer"
        className="group border-line bg-surface/60 hover:border-accent-text grid items-center gap-8 overflow-hidden rounded-3xl border p-6 transition-colors md:grid-cols-[auto_1fr_auto] md:p-8"
      >
        <img
          src="/media/developer.webp"
          alt="Emmanuel's 3D character wearing headphones"
          width={160}
          height={160}
          loading="lazy"
          className="size-32 rounded-2xl object-cover md:size-40"
        />
        <div>
          <p className="spec text-accent-text">Built by</p>
          <h2 id="dev-h" className="font-display mt-2 text-4xl font-bold">
            Emmanuel Wilson
          </h2>
          <p className="text-muted mt-2 max-w-md">
            Designer-developer behind EWSTUDIOS. Come and say hello.
          </p>
        </div>
        <ArrowRight
          className="text-muted group-hover:text-accent-text size-8 transition-transform group-hover:translate-x-1"
          aria-hidden
        />
      </Link>
    </section>
  )
}
