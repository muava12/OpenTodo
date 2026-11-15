// The app's sign-in (OpenSpec change rn-taskito-foundation, design D5 of the
// foundation): the PKCE pair, the confirmation URL, the code exchange and the
// refresh, all pure so they are unit-tested. The native sheet and the secure
// store are the caller's (src/App.tsx), and the platform port supplies the
// device name and the crypto this needs.
import { createHash, randomBytes, webcrypto } from 'node:crypto'

/** A token pair the server returned. */
export interface Tokens {
  access_token: string
  refresh_token: string
  /** Seconds the access token is valid; the app treats it as one hour. */
  expires_in: number
}

/** What the app asks the server; the answer is the envelope's error code or the pair. */
export type TokenAnswer = { ok: true; tokens: Tokens } | { ok: false; problem: string }

/** The error codes of POST /api/v1/app/token (foundation, account-access). */
export const TOKEN_ERRORS = ['invalid_grant', 'invalid_request', 'demo_restricted', 'rate_limited'] as const

/** The scheme the server redirects to (foundation D5). */
export const REDIRECT = 'opentodo://signed-in'

const b64url = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64url')

/** A PKCE pair (RFC 7636): the verifier and its S256 challenge. */
export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = b64url(randomBytes(32))
  const challenge = b64url(createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

/** The confirmation URL the system sheet opens (foundation D5). */
export function signInURL(args: { server: string; challenge: string; state: string; device: string }): string {
  const u = new URL('/app/sign-in', args.server)
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('The server address must be http(s).')
  u.searchParams.set('code_challenge', args.challenge)
  u.searchParams.set('code_challenge_method', 'S256')
  u.searchParams.set('state', args.state)
  u.searchParams.set('device', args.device)
  return u.toString()
}

/** POST /api/v1/app/token with the code and the verifier, or with a refresh token. */
async function post(server: string, body: Record<string, unknown>, fetchFn: typeof fetch): Promise<TokenAnswer> {
  let res: Response
  try {
    res = await fetchFn(`${server}/api/v1/app/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return { ok: false, problem: 'network' }
  }
  if (res.ok) {
    const data: unknown = await res.json().catch(() => null)
    const t = data as Partial<Tokens> | null
    if (!t || typeof t.access_token !== 'string' || typeof t.refresh_token !== 'string') {
      return { ok: false, problem: 'invalid_request' }
    }
    return { ok: true, tokens: { access_token: t.access_token, refresh_token: t.refresh_token, expires_in: Number(t.expires_in) || 3600 } }
  }
  const data: unknown = await res.json().catch(() => null)
  const code = (data as { error?: { code?: unknown } } | null)?.error?.code
  return { ok: false, problem: typeof code === 'string' && (TOKEN_ERRORS as readonly string[]).includes(code) ? code : 'invalid_grant' }
}

/** Exchange the single-use code for a token pair. */
export function exchangeCode(
  args: { server: string; code: string; verifier: string; state: string },
  fetchFn: typeof fetch = fetch,
): Promise<TokenAnswer> {
  return post(args.server, { grant_type: 'authorization_code', code: args.code, code_verifier: args.verifier, state: args.state }, fetchFn)
}

/** Exchange a refresh token for a new pair; a reused one is refused with invalid_grant. */
export function refreshTokens(
  args: { server: string; refresh: string },
  fetchFn: typeof fetch = fetch,
): Promise<TokenAnswer> {
  return post(args.server, { grant_type: 'refresh_token', refresh_token: args.refresh }, fetchFn)
}

/** A verifier with the S256 challenge, over the app's crypto (react-native-quick-crypto in the app, Web Crypto in Jest). */
export function verifierAndChallenge(): { verifier: string; challenge: string } {
  return pkcePair()
}

// The app's crypto for the sheet's state and the code verifier. The shared library
// uses Web Crypto; this names the same functions over the host's implementation.
export const crypto = webcrypto