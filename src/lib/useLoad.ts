import { useEffect, useState, type DependencyList } from 'react'

/**
 * Loads data for a page and reloads when `deps` change. Answers are tagged with the deps they were for, so
 * a slow answer to an older request never shows, and the page reads as loading until the new one lands.
 */
export function useLoad<T>(load: () => Promise<T>, deps: DependencyList) {
  const key = JSON.stringify(deps)
  const [state, setState] = useState<{ key: string; data: T | null; error: string | null } | null>(
    null,
  )
  useEffect(() => {
    let live = true
    load()
      .then((data) => live && setState({ key, data, error: null }))
      .catch(
        (e: unknown) =>
          live &&
          setState({ key, data: null, error: e instanceof Error ? e.message : 'Loading failed.' }),
      )
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands for the caller's deps
  }, [key])
  const current = state?.key === key ? state : null
  return { data: current?.data ?? null, error: current?.error ?? null, loading: !current }
}
