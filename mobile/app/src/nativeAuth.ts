// The native side of sign-in (OpenSpec change rn-taskito-foundation, design D5 of
// the foundation): the system authentication sheet (expo-web-browser) and the
// secure token store (expo-secure-store). The logic is in src/signInSession and
// src/tokenStore, which tests run with fakes; this module is the thin native
// implementation the app installs.
import * as SecureStore from 'expo-secure-store'
import * as WebBrowser from 'expo-web-browser'
import { pkcePair } from './signIn'
import { signIn as runSignIn, type Sheet } from './signInSession'
import { tokenStore, type TokenStorage } from './tokenStore'
import type { Tokens } from './signIn'

/** The sheet over expo-web-browser's auth session. */
export const sheet: Sheet = {
  async open(url) {
    const r = await WebBrowser.openAuthSessionAsync(url, 'opentodo://signed-in')
    if (r.type === 'success') return { type: 'success', url: r.url }
    if (r.type === 'cancel' || r.type === 'dismiss') return { type: 'cancel' }
    return { type: 'error', error: 'unavailable' }
  },
}

/** The secure store over expo-secure-store. */
export const storage: TokenStorage = {
  read(key) { return SecureStore.getItem(key) },
  write(key, value) { SecureStore.setItem(key, value) },
  clear(key) { SecureStore.deleteItemAsync(key) },
}

/** The device name the confirmation page shows. */
export const deviceName = (): string => 'OpenTodo app'

/** The token store the app uses. */
export const tokens = tokenStore(storage)

/** One sign-in through the sheet; see src/signInSession for the flow. */
export function signIn(args: { server: string }): Promise<{ ok: true; tokens: Tokens } | { ok: false; problem: string }> {
  return runSignIn({ server: args.server, device: deviceName() }, {
    sheet,
    fetch,
    tokens,
    device: deviceName,
    verifier: pkcePair,
    state: () => pkcePair().verifier,
  })
}