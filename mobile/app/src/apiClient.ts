// The app's REST client for the shared library (OpenSpec change
// rn-taskito-foundation, task 1.2): the shared modules call fetch with a path
// like /api/v1/sync, as on the web where the page's origin answers them. In the
// app there is no origin and no cookie, so this module wraps the platform fetch:
// every request goes to the account's server with the app's access token as a
// Bearer header, and the token is refreshed on a 401.
//
// It touches no webapp code: the app installs it over the platform's fetch and
// the shared modules are unchanged.
import { refreshTokens, type Tokens } from './signIn'

/** The minimum a token store must do for the client; tests pass a fake. */
export interface TokenSource {
  load(): Promise<Tokens | null>
  save(tokens: Tokens): Promise<void>
  clear(): Promise<void>
}

/** What the client needs; tests pass fakes. */
export interface ClientDeps {
  server: string
  tokens: TokenSource
  /** The platform fetch; Node's in Jest, the app's in the app. */
  fetch: typeof fetch
}

/** A fetch that signs every request and refreshes the token once on a 401. */
export function apiFetch(deps: ClientDeps): typeof fetch {
  const { server, tokens } = deps
  const base = server.replace(/\/+$/, '')

  return async (input, init = {}) => {
    const url = String(input)
    const path = /^https?:\/\//i.test(url) ? url : `${base}${url.startsWith('/') ? '' : '/'}${url}`
    const headers = new Headers(init.headers)
    const pair = await tokens.load()
    if (pair && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${pair.access_token}`)

    let res = await deps.fetch(path, { ...init, headers })
    if (res.status === 401 && pair) {
      // The access token expired (or the grant ended): try one refresh, then one retry.
      const next = await refreshTokens({ server: base, refresh: pair.refresh_token }, deps.fetch)
      if (!next.ok) {
        await tokens.clear()
        return res
      }
      await tokens.save(next.tokens)
      const retry = new Headers(init.headers)
      retry.set('Authorization', `Bearer ${next.tokens.access_token}`)
      res = await deps.fetch(path, { ...init, headers: retry })
    }
    return res
  }
}

/** The server's origin for an account (the client's base). */
export function origin(server: string): string {
  return server.replace(/\/+$/, '')
}