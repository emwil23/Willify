import { SiteLayout } from '@/components/SiteLayout'
import { NotFound } from '@/pages/NotFound'
import { useSettings, applyTheme } from '@/stores/settings'
import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { Toaster } from 'sonner'

function Root() {
  const theme = useSettings((s) => s.theme)
  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])
  return (
    <>
      <Outlet />
      <Toaster
        position="bottom-center"
        theme={theme === 'system' ? 'system' : theme}
        richColors
        closeButton
      />
    </>
  )
}

const root = createRootRoute({ component: Root, notFoundComponent: NotFound })

const site = createRoute({ getParentRoute: () => root, id: 'site', component: SiteLayout })
// The app shell is lazy too, so the landing page doesn't download the app.
const shell = createRoute({
  getParentRoute: () => root,
  id: 'shell',
  component: lazyRouteComponent(() => import('@/components/AppShell'), 'AppShell'),
})

const sitePages = [
  createRoute({
    getParentRoute: () => site,
    path: '/',
    component: lazyRouteComponent(() => import('@/pages/Landing'), 'Landing'),
  }),
  createRoute({
    getParentRoute: () => site,
    path: 'developer',
    component: lazyRouteComponent(() => import('@/pages/Developer'), 'Developer'),
  }),
  createRoute({
    getParentRoute: () => site,
    path: 'pro',
    component: lazyRouteComponent(() => import('@/pages/Pro'), 'Pro'),
  }),
  createRoute({
    getParentRoute: () => site,
    path: 'privacy',
    component: lazyRouteComponent(() => import('@/pages/Legal'), 'Privacy'),
  }),
  createRoute({
    getParentRoute: () => site,
    path: 'terms',
    component: lazyRouteComponent(() => import('@/pages/Legal'), 'Terms'),
  }),
]

const appPages = [
  createRoute({
    getParentRoute: () => shell,
    path: 'app',
    // ?vibe=... starts the DJ straight away (landing page box, example chips, PWA shortcut).
    validateSearch: (s: Record<string, unknown>): { vibe?: string } =>
      typeof s.vibe === 'string' && s.vibe.trim() ? { vibe: s.vibe.slice(0, 300) } : {},
    component: lazyRouteComponent(() => import('@/pages/Dj'), 'Dj'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/search',
    validateSearch: (
      s: Record<string, unknown>,
    ): { q?: string; tab?: 'songs' | 'albums' | 'artists' } => ({
      ...(typeof s.q === 'string' && s.q ? { q: s.q.slice(0, 100) } : {}),
      ...(s.tab === 'albums' || s.tab === 'artists' ? { tab: s.tab } : {}),
    }),
    component: lazyRouteComponent(() => import('@/pages/SearchPage'), 'SearchPage'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/artist/$artistId',
    component: lazyRouteComponent(() => import('@/pages/ArtistPage'), 'ArtistPage'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/album/$albumId',
    component: lazyRouteComponent(() => import('@/pages/AlbumPage'), 'AlbumPage'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/galaxy',
    component: lazyRouteComponent(() => import('@/pages/Galaxy'), 'Galaxy'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/library',
    component: lazyRouteComponent(() => import('@/pages/Library'), 'Library'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/playlist/$playlistId',
    component: lazyRouteComponent(() => import('@/pages/PlaylistPage'), 'PlaylistPage'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/quiz',
    // ?playlist=<id> quizzes you on one of your playlists instead of the daily challenge.
    validateSearch: (s: Record<string, unknown>): { playlist?: string } =>
      typeof s.playlist === 'string' && s.playlist ? { playlist: s.playlist.slice(0, 64) } : {},
    component: lazyRouteComponent(() => import('@/pages/Quiz'), 'Quiz'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/now-playing',
    component: lazyRouteComponent(() => import('@/pages/NowPlaying'), 'NowPlaying'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'settings',
    component: lazyRouteComponent(() => import('@/pages/SettingsPage'), 'SettingsPage'),
  }),
]

const routeTree = root.addChildren([site.addChildren(sitePages), shell.addChildren(appPages)])

export const router = createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
