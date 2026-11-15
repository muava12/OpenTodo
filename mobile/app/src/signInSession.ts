// The sign-in session over the native sheet (OpenSpec change rn-taskito-foundation,
// design D5 of the foundation): the state and the PKCE pair, the sheet, the redirect
// back to the app's scheme, and the exchange of the code for the stored pair.
import { signInURL, REDIRECT, exchangeCode, type TokenAnswer, type Tokens } from './signIn'
import type { tokenStore } from './tokenStore'

/** What the platform's authentication sheet does (expo-web-browser in the app). */
export interface Sheet {
  open(url: string): Promise<{ type: 'success' | 'cancel' | 'error'; url?: string; error?: string }>
}

/** What a session needs from the platform; tests pass fakes. */
export interface SignInDeps {
  sheet: Sheet
  fetch: typeof fetch
  tokens: ReturnType<typeof tokenStore>
  device: () => string
  verifier: () => { verifier: string; challenge: string }
  /** The session's state; the redirect must echo it. Tests fix it. */
  state: () => string
}

/** The result of a sign-in: the stored pair, or what went wrong. */
export type SignInResult = { ok: true; tokens: Tokens } | { ok: false; problem: string }

/** The code and the state from a redirect URL, or null when it is not ours. */
export function parseRedirect(url: string): { code?: string; state?: string } | null {
  if (!url.startsWith(REDIRECT)) return null
  try {
    const u = new URL(url)
    return { code: u.searchParams.get('code') ?? undefined, state: u.searchParams.get('state') ?? undefined }
  } catch {
    return null
  }
}

/**
 * Run one sign-in: open the sheet, read the redirect, check the state, exchange the
 * code and store the pair. The sheet is the system's, so password, second factor,
 * passkeys and single sign-on all run there; the app never sees them.
 */
export async function signIn(args: { server: string; device: string }, deps: SignInDeps): Promise<SignInResult> {
  const state = deps.state()
  const pair = deps.verifier()
  const url = signInURL({ server: args.server, challenge: pair.challenge, state, device: args.device })
  const opened = await deps.sheet.open(url)
  if (opened.type === 'cancel') return { ok: false, problem: 'cancelled' }
  if (opened.type === 'error') return { ok: false, problem: 'sheet' }
  const redirect = parseRedirect(opened.url ?? '')
  if (!redirect) return { ok: false, problem: 'redirect' }
  if (!redirect.code) return { ok: false, problem: 'code' }
  if (redirect.state !== state) return { ok: false, problem: 'state' }
  const answer: TokenAnswer = await exchangeCode(
    { server: args.server, code: redirect.code, verifier: pair.verifier, state },
    deps.fetch,
  )
  if (!answer.ok) return answer
  await deps.tokens.save(answer.tokens)
  return answer
}