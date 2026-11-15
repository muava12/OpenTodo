// The app's token storage (OpenSpec change rn-taskito-foundation, design D5 of
// the foundation): the pair lives in the Keychain or Keystore, never in MMKV. The
// storage is the platform's secure store (expo-secure-store in the app); this
// module only names the keys and validates what comes back.
import type { Tokens } from './signIn'

/** What the platform's secure store can do; tests pass a fake. */
export interface TokenStorage {
  read(key: string): string | null
  write(key: string, value: string): void
  clear(key: string): void
}

const KEY = 'tokens'

/** The stored pair is JSON; a value that is not, or is missing a field, is no pair. */
export function parseTokens(raw: string | null): Tokens | null {
  if (!raw) return null
  let data: unknown
  try { data = JSON.parse(raw) } catch { return null }
  const t = data as Partial<Tokens> | null
  if (!t || typeof t.access_token !== 'string' || typeof t.refresh_token !== 'string') return null
  return { access_token: t.access_token, refresh_token: t.refresh_token, expires_in: Number(t.expires_in) || 3600 }
}

/** The token store over the platform's secure storage. */
export function tokenStore(storage: TokenStorage) {
  return {
    async save(tokens: Tokens): Promise<void> {
      storage.write(KEY, JSON.stringify(tokens))
    },
    async load(): Promise<Tokens | null> {
      return parseTokens(storage.read(KEY))
    },
    async clear(): Promise<void> {
      storage.clear(KEY)
    },
  }
}