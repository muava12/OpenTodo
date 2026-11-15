// The account's session in the app (OpenSpec change rn-taskito-foundation, task
// 1.2): after sign-in, the app opens the account's database, installs the
// authenticated fetch, tells the shared library who is signed in, and starts the
// sync engine. The lifecycle (foreground, background, online) is the platform
// port's, which sync.ts already follows. No webapp code changes: the app wires
// the shared modules through the platform's own hooks.
import { api } from '@shared/api'
import { setCurrentUserId } from '@shared/sharing'
import { startSync, stopSync } from '@shared/sync'
import { apiFetch } from './apiClient'
import { openAccount } from './storage/account'
import { tokens } from './nativeAuth'

/** What startAccount wires; tests pass fakes for the shared parts. */
export interface SyncHooks {
  fetch: typeof fetch
  openAccount: typeof openAccount
  start: () => void
}

/** The hooks the app installs; tests replace them. */
let hooks: Partial<SyncHooks> = {}

/** Replace the wiring; the default is the real one (src/account's own imports). */
export function installSyncHooks(next: Partial<SyncHooks>): void {
  hooks = next
}

/** The fetch the shared library sees: the app's signed, server-prefixed fetch. */
export function installFetch(server: string): void {
  const f = apiFetch({ server, tokens, fetch: hooks.fetch ?? globalThis.fetch })
  // The shared modules call the global fetch by name; the app replaces it with the
  // signed one for the session, as the web's own origin serves the same path.
  ;(globalThis as Record<string, unknown>).fetch = f
}

/** Open the account's database, sign the shared library in and start sync. */
export async function startAccount(server: string): Promise<void> {
  installFetch(server)
  const me = await api.me()
  const open = hooks.openAccount ?? openAccount
  open(server, me.user.id)
  await setCurrentUserId(me.user.id)
  ;(hooks.start ?? startSync)()
}

/** Stop sync and forget the account's data (sign-out). */
export async function stopAccount(): Promise<void> {
  stopSync()
  const { forgetAccount } = await import('./storage/account')
  await forgetAccount()
}