import { useSettings } from '@/stores/settings'
import type { ActionInputs, ActionName, ActionOutputs } from './actions'
import { jsonLines } from './lines'
import { providerById } from './providers'

/** True when the provider picked in Settings can run now without another sign-in step. */
export async function aiReady(): Promise<boolean> {
  const provider = providerById(useSettings.getState().provider)
  return Boolean(provider && (await provider.ready()))
}

/** Runs one action with the provider picked in Settings and yields its JSON lines as they stream in. */
export async function* aiLines<A extends ActionName>(
  action: A,
  input: ActionInputs[A],
  signal: AbortSignal,
): AsyncGenerator<ActionOutputs[A]> {
  const provider = providerById(useSettings.getState().provider)
  if (!provider) throw new Error('Pick an AI provider in Settings first.')
  yield* jsonLines<ActionOutputs[A]>(provider.run(action, input, signal))
}
