import { aiLines, aiReady } from '@/ai/run'
import { AppleMusicLink, ItunesCredit } from '@/components/AppleMusic'
import { Artwork } from '@/components/Artwork'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { db } from '@/lib/db'
import { charts } from '@/lib/music'
import { buildRounds, CLUES, daySeed, safeClues, scoreRound, seeded, type Round } from '@/lib/quiz'
import { usePlayer } from '@/player/store'
import { useSettings } from '@/stores/settings'
import { Link, useSearch } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Lightbulb, Loader2, Play, RotateCcw, Trophy, X } from 'lucide-react'
import { useLoad } from '@/lib/useLoad'
import { useEffect, useState } from 'react'

interface Game {
  id: string
  label: string
  rounds: Round[]
  clues: string[][]
}

/** Loads the pool and the clues: AI clues when a provider is ready, the songs' own details otherwise. */
async function loadGame(playlistId: string | undefined, country: string): Promise<Game> {
  let rounds: Round[]
  let id: string
  let label: string
  if (playlistId) {
    const p = await db.playlists.get(playlistId)
    if (!p) throw new Error("That playlist isn't in this browser.")
    rounds = buildRounds(p.tracks, Math.random)
    id = `playlist-${p.id}-${String(Date.now())}`
    label = `Quiz: ${p.title}`
  } else {
    const today = new Date()
    rounds = buildRounds(await charts(country), seeded(daySeed(today)))
    id = `daily-${String(daySeed(today))}`
    label = `Daily challenge · ${today.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}`
  }
  if (rounds.length < 3)
    throw new Error('Not enough songs with previews for a quiz. Try a longer playlist.')

  const ai: string[][] = []
  if (await aiReady()) {
    try {
      const tracks = rounds.map(({ answer: t }) => ({
        artist: t.artist,
        title: t.title,
        album: t.album,
        year: t.year,
        genre: t.genre,
      }))
      for await (const l of aiLines('hints', { tracks }, AbortSignal.timeout(45_000)))
        if (typeof l.i === 'number' && Array.isArray(l.hints))
          ai[l.i] = l.hints.filter((h) => typeof h === 'string')
    } catch {
      // Fall back to clues from the songs' own details.
    }
  }
  return { id, label, rounds, clues: rounds.map((r, i) => safeClues(r.answer, ai[i])) }
}

export function Quiz() {
  const { playlist } = useSearch({ from: '/shell/app/quiz' })
  const country = useSettings((s) => s.country)
  const [attempt, setAttempt] = useState(0)
  // A new key starts a fresh game: new rounds, score back to zero.
  return (
    <QuizGame
      key={`${playlist ?? 'daily'}-${country}-${String(attempt)}`}
      playlist={playlist}
      country={country}
      restart={() => setAttempt((n) => n + 1)}
    />
  )
}

function QuizGame({
  playlist,
  country,
  restart,
}: {
  playlist: string | undefined
  country: string
  restart: () => void
}) {
  const { data: game, error } = useLoad(() => loadGame(playlist, country), [playlist, country])
  const [round, setRound] = useState(0)
  const [shown, setShown] = useState(1)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [correct, setCorrect] = useState(0)
  const playedToday = useLiveQuery(
    () => (playlist ? undefined : db.quiz.get(`daily-${String(daySeed(new Date()))}`)),
    [playlist],
  )

  const r = game?.rounds[round]
  const finished = game && round >= game.rounds.length

  useEffect(() => {
    if (!game || round < game.rounds.length) return
    // A replay of the daily challenge only replaces the saved result if it beats it.
    void db.quiz.get(game.id).then((best) => {
      if (!best || score > best.score)
        return db.quiz.put({
          id: game.id,
          score,
          correct,
          rounds: game.rounds.length,
          at: Date.now(),
        })
    })
  }, [game, round, score, correct])

  function answer(i: number) {
    if (!r || picked !== null) return
    setPicked(i)
    const right = r.options[i]?.id === r.answer.id
    setScore((s) => s + scoreRound({ correct: right, cluesUsed: shown, streak }))
    setStreak((s) => (right ? s + 1 : 0))
    if (right) setCorrect((c) => c + 1)
    // The reveal is where the preview plays: next to the song's Apple Music link and the iTunes credit.
    usePlayer.getState().playQueue([r.answer], 0)
  }

  function nextRound() {
    usePlayer.getState().stop()
    setRound((n) => n + 1)
    setShown(1)
    setPicked(null)
  }

  return (
    <div className="stars flex-1">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <p className="spec text-accent-text">
          {game?.label ?? (playlist ? 'Playlist quiz' : 'Daily challenge')}
        </p>
        <h1 className="font-display mt-1 text-5xl font-bold [font-stretch:85%]">Name that song</h1>
        <p className="text-muted mt-2 text-sm">
          Guess from the clues. Fewer clues, more points. The preview plays once you answer.
        </p>

        {error && (
          <div role="alert" className="border-danger/30 bg-danger/10 mt-8 rounded-2xl border p-4">
            <p className="text-danger">{error}</p>
            <Button className="mt-3" size="sm" onClick={restart}>
              <RotateCcw /> Try again
            </Button>
          </div>
        )}
        {!game && !error && (
          <p className="text-muted mt-10 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Writing today's clues…
          </p>
        )}
        {!playlist && playedToday && round === 0 && picked === null && (
          <p role="status" className="border-line mt-6 rounded-xl border p-3 text-sm">
            You scored {playedToday.score} today ({playedToday.correct}/{playedToday.rounds}). Play
            again for fun; your best stays saved.
          </p>
        )}

        {game && r && (
          <section
            aria-labelledby="round-h"
            className="border-line bg-surface shadow-card mt-8 rounded-3xl border p-6 sm:p-8"
          >
            <div className="flex items-center justify-between">
              <h2 id="round-h" className="spec text-muted">
                Round {round + 1} of {game.rounds.length}
              </h2>
              <p className="spec text-muted" aria-live="polite">
                Score {score} · streak {streak}
              </p>
            </div>
            <ol className="mt-5 space-y-3" aria-label="Clues">
              {game.clues[round]?.slice(0, picked === null ? shown : CLUES).map((c, i) => (
                <li key={i} className="flex gap-3">
                  <Lightbulb className="text-accent-text mt-1 size-4 shrink-0" aria-hidden />
                  <span className="font-display text-xl leading-snug">{c}</span>
                </li>
              ))}
            </ol>
            {picked === null && shown < CLUES && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-3"
                onClick={() => setShown((n) => n + 1)}
              >
                Show another clue (−100)
              </Button>
            )}
            <div className="mt-6 grid gap-2 sm:grid-cols-2" role="group" aria-label="Answers">
              {r.options.map((o, i) => {
                const isAnswer = o.id === r.answer.id
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={picked !== null}
                    onClick={() => answer(i)}
                    className={cn(
                      'border-line enabled:hover:border-accent-text rounded-2xl border p-4 text-left transition-colors',
                      picked !== null && isAnswer && 'border-live bg-live/10',
                      picked === i && !isAnswer && 'border-danger bg-danger/10',
                    )}
                  >
                    <span className="block font-medium">{o.title}</span>
                    <span className="text-muted block text-sm">{o.artist}</span>
                    {picked !== null && (isAnswer || picked === i) && (
                      <span className="sr-only">
                        {isAnswer ? '(correct answer)' : '(your answer, wrong)'}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {picked !== null && (
              <div
                className="border-line mt-6 flex flex-wrap items-center gap-4 border-t pt-6"
                role="status"
              >
                <Artwork
                  src={r.answer.artwork}
                  size={200}
                  alt={`Artwork for ${r.answer.album ?? r.answer.title}`}
                  className="size-20 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'flex items-center gap-1 font-medium',
                      r.options[picked]?.id === r.answer.id ? 'text-live' : 'text-danger',
                    )}
                  >
                    {r.options[picked]?.id === r.answer.id ? (
                      <Check className="size-4" aria-hidden />
                    ) : (
                      <X className="size-4" aria-hidden />
                    )}
                    {r.options[picked]?.id === r.answer.id ? 'Correct!' : 'Not this time.'}
                  </p>
                  <p className="truncate">
                    {r.answer.title} · <span className="text-muted">{r.answer.artist}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => usePlayer.getState().playQueue([r.answer], 0)}
                      className="text-accent-text inline-flex items-center gap-1 text-xs"
                    >
                      <Play className="size-3" aria-hidden /> Preview
                    </button>
                    <AppleMusicLink
                      url={r.answer.url}
                      label={`Open ${r.answer.title} in Apple Music`}
                    />
                  </div>
                  <ItunesCredit className="mt-1 text-[9px]" />
                </div>
                <Button variant="primary" onClick={nextRound}>
                  {round + 1 < game.rounds.length ? 'Next round' : 'See my score'}
                </Button>
              </div>
            )}
          </section>
        )}

        {finished && (
          <section
            aria-labelledby="done-h"
            className="border-line bg-surface shadow-card mt-8 rounded-3xl border p-8 text-center"
          >
            <Trophy className="text-accent-text mx-auto size-10" aria-hidden />
            <h2 id="done-h" className="font-display mt-3 text-4xl font-bold">
              {score} points
            </h2>
            <p className="text-muted mt-1">
              {correct} of {game.rounds.length} right
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button onClick={restart}>
                <RotateCcw /> Play again
              </Button>
              <Button asChild variant="primary">
                <Link to="/app/library">Quiz me on a playlist</Link>
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
