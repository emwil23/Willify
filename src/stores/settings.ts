import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'system' | 'dark' | 'light'
export type ProviderId = 'ew' | 'puter' | 'openrouter' | 'own'

export interface Settings {
  theme: Theme
  provider: ProviderId | null
  /** From OpenRouter's PKCE sign-in. Kept only in this browser. */
  openrouterKey: string | null
  openrouterModel: string
  /** Any OpenAI-compatible endpoint. Kept only in this browser. */
  ownKey: string | null
  ownBaseUrl: string
  ownModel: string
  /** The iTunes storefront to search, as a two-letter country code. */
  country: string
  set: (patch: Partial<Omit<Settings, 'set'>>) => void
}

/** The browser's region ("en-GB" → "GB"), else the US store. */
export function defaultCountry(lang = typeof navigator === 'undefined' ? '' : navigator.language) {
  const region = /-([A-Z]{2})(?![A-Za-z])/.exec(lang)?.[1]
  return region ? region.toUpperCase() : 'US'
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      theme: 'system',
      provider: null,
      openrouterKey: null,
      openrouterModel: 'openrouter/free',
      ownKey: null,
      ownBaseUrl: 'https://api.openai.com/v1',
      ownModel: 'gpt-5-mini',
      country: defaultCountry(),
      set: (patch) => set(patch),
    }),
    { name: 'willify-settings' },
  ),
)

export function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}
