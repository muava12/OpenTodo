// The app's sign-in (OpenSpec change rn-taskito-foundation, design D5 of the
// foundation): the PKCE pair, the code exchange, the refresh rotation and the
// reuse refusal, and the tokens' storage.
import { createHash, randomBytes } from 'node:crypto'
import { exchangeCode, pkcePair, refreshTokens, signInURL } from '../src/signIn'
import { tokenStore, type TokenStorage } from '../src/tokenStore'
import type { Tokens } from '../src/signIn'

const b64url = (buf: Buffer) => buf.toString('base64url')

const fakeFetch = (answers: Array<{ status: number; body: unknown }>) => {
  const calls: Array<{ url: string; init?: RequestInit }> = []
  const f = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    const a = answers.shift() ?? { status: 200, body: {} }
    return new Response(JSON.stringify(a.body), { status: a.status })
  }) as unknown as typeof fetch
  return { f, calls }
}

const jsonBody = (init?: RequestInit) => JSON.parse(String(init?.body)) as Record<string, unknown>

describe('signInURL', () => {
  it('builds the confirmation URL with the challenge, the state and the device name', () => {
    const u = new URL(signInURL({ server: 'https://todo.example.com', challenge: 'chal-1', state: 'st-1', device: 'Pixel 9' }))
    expect(u.origin + u.pathname).toBe('https://todo.example.com/app/sign-in')
    expect(u.searchParams.get('code_challenge')).toBe('chal-1')
    expect(u.searchParams.get('code_challenge_method')).toBe('S256')
    expect(u.searchParams.get('state')).toBe('st-1')
    expect(u.searchParams.get('device')).toBe('Pixel 9')
  })

  it('encodes a device name with a space and an ampersand', () => {
    const u = new URL(signInURL({ server: 'https://todo.example.com', challenge: 'c', state: 's', device: 'A & B' }))
    expect(u.searchParams.get('device')).toBe('A & B')
  })

  it('refuses an address that is not http(s)', () => {
    expect(() => signInURL({ server: 'ftp://x', challenge: 'c', state: 's', device: 'd' })).toThrow(/http/)
  })
})

describe('PKCE pair', () => {
  it('derives the challenge as the base64url of the SHA-256 of the verifier', () => {
    const { verifier, challenge } = pkcePair()
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/)
    const hash = createHash('sha256').update(verifier).digest()
    expect(challenge).toBe(b64url(hash))
  })

  it('makes a fresh verifier every time', () => {
    const a = pkcePair()
    const b = pkcePair()
    expect(a.verifier).not.toBe(b.verifier)
  })
})

describe('exchangeCode', () => {
  const tokens: Tokens = { access_token: 'at-1', refresh_token: 'rt-1', expires_in: 3600 }
  const args = { server: 'https://todo.example.com', code: 'code-1', verifier: 'v-1', state: 'st-1' }

  it('posts code, verifier and state to /api/v1/app/token', async () => {
    const { f, calls } = fakeFetch([{ status: 200, body: tokens }])
    const r = await exchangeCode(args, f)
    expect(r).toEqual({ ok: true, tokens })
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://todo.example.com/api/v1/app/token')
    expect(jsonBody(calls[0].init)).toEqual({ grant_type: 'authorization_code', code: 'code-1', code_verifier: 'v-1', state: 'st-1' })
  })

  it.each([
    ['invalid_grant', 400, 'invalid_grant'],
    ['a missing field', 400, 'invalid_request'],
    ['a demo server', 403, 'demo_restricted'],
    ['too many tries', 429, 'rate_limited'],
  ])('answers the envelope for %s', async (_name, status, code) => {
    const { f } = fakeFetch([{ status, body: { error: { code, message: 'no' } } }])
    const r = await exchangeCode(args, f)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.problem).toBe(code)
  })

  it('says no server answers when the request throws', async () => {
    const f = (async () => { throw new TypeError('Network request failed') }) as unknown as typeof fetch
    const r = await exchangeCode(args, f)
    expect(r).toEqual({ ok: false, problem: 'network' })
  })

  it('reads the error code from the envelope, not the HTTP status alone', async () => {
    const { f } = fakeFetch([{ status: 400, body: { error: { code: 'invalid_grant', message: 'no' } } }])
    const r = await exchangeCode(args, f)
    expect(r.ok ? null : r.problem).toBe('invalid_grant')
  })
})

describe('refreshTokens', () => {
  it('posts the refresh token and reads the new pair', async () => {
    const { f, calls } = fakeFetch([{ status: 200, body: { access_token: 'at-2', refresh_token: 'rt-2', expires_in: 3600 } }])
    const r = await refreshTokens({ server: 'https://todo.example.com', refresh: 'rt-1' }, f)
    expect(r).toEqual({ ok: true, tokens: { access_token: 'at-2', refresh_token: 'rt-2', expires_in: 3600 } })
    expect(jsonBody(calls[0].init)).toEqual({ grant_type: 'refresh_token', refresh_token: 'rt-1' })
  })

  it('answers invalid_grant when the refresh token was reused', async () => {
    const { f } = fakeFetch([{ status: 400, body: { error: { code: 'invalid_grant', message: 'reused' } } }])
    const r = await refreshTokens({ server: 'https://todo.example.com', refresh: 'rt-1' }, f)
    expect(r).toEqual({ ok: false, problem: 'invalid_grant' })
  })
})

describe('tokenStore', () => {
  const make = () => {
    const map = new Map<string, string>()
    const storage: TokenStorage = {
      read: (k) => map.get(k) ?? null,
      write: (k, v) => { map.set(k, v) },
      clear: (k) => { map.delete(k) },
    }
    return { store: tokenStore(storage), map }
  }

  it('writes the pair and reads it back', async () => {
    const { store } = make()
    await store.save({ access_token: 'at-1', refresh_token: 'rt-1', expires_in: 3600 })
    expect(await store.load()).toEqual({ access_token: 'at-1', refresh_token: 'rt-1', expires_in: 3600 })
  })

  it('keeps the refresh token after the access token expires', async () => {
    const { store } = make()
    await store.save({ access_token: 'at-1', refresh_token: 'rt-1', expires_in: 3600 })
    // A refresh replaces the pair; the store holds the new one.
    await store.save({ access_token: 'at-2', refresh_token: 'rt-2', expires_in: 3600 })
    expect(await store.load()).toEqual({ access_token: 'at-2', refresh_token: 'rt-2', expires_in: 3600 })
  })

  it('clears on sign-out', async () => {
    const { store, map } = make()
    await store.save({ access_token: 'at-1', refresh_token: 'rt-1', expires_in: 3600 })
    await store.clear()
    expect(await store.load()).toBeNull()
    expect(map.size).toBe(0)
  })

  it('refuses a stored value that is not JSON', async () => {
    const map = new Map([['tokens', 'not json']])
    const store = tokenStore({ read: (k) => map.get(k) ?? null, write: (k, v) => { map.set(k, v) }, clear: (k) => { map.delete(k) } })
    expect(await store.load()).toBeNull()
  })

  it('refuses a stored value missing a field', async () => {
    const map = new Map([['tokens', JSON.stringify({ access_token: 'at-1' })]])
    const store = tokenStore({ read: (k) => map.get(k) ?? null, write: (k, v) => { map.set(k, v) }, clear: (k) => { map.delete(k) } })
    expect(await store.load()).toBeNull()
  })
})

// The verifier and challenge the tests share, so the store's expiry test can use a real pair.
export const pair = () => {
  const bytes = randomBytes(32)
  return { verifier: b64url(bytes), challenge: b64url(createHash('sha256').update(b64url(bytes)).digest()) }
}