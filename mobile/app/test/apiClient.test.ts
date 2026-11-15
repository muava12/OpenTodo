// The app's REST client over the platform fetch (OpenSpec change
// rn-taskito-foundation, task 1.2).
import { apiFetch, origin, type ClientDeps, type TokenSource } from '../src/apiClient'
import type { Tokens } from '../src/signIn'

const server = 'https://todo.example.com/'
const pair = (at: string, rt: string): Tokens => ({ access_token: at, refresh_token: rt, expires_in: 3600 })

const makeTokens = (initial: Tokens | null) => {
  let value = initial
  return {
    load: async () => value,
    save: async (t: Tokens) => { value = t },
    clear: async () => { value = null },
  }
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('apiFetch', () => {
  const deps = (tokens: TokenSource, f: typeof fetch = fetch): ClientDeps => ({ server, tokens, fetch: f })

  it('prefixes a path with the server and sends the bearer token', async () => {
    const seen: Array<{ url: string; init?: RequestInit }> = []
    const f = (async (url: string, init?: RequestInit) => { seen.push({ url, init }); return json({ ok: true }) }) as unknown as typeof fetch
    const res = await apiFetch(deps(makeTokens(pair('at-1', 'rt-1')), f))('/api/v1/me')
    expect(res.ok).toBe(true)
    expect(seen[0].url).toBe('https://todo.example.com/api/v1/me')
    expect(new Headers(seen[0].init?.headers).get('Authorization')).toBe('Bearer at-1')
  })

  it('passes an absolute URL through unchanged', async () => {
    let asked = ''
    const f = (async (url: string) => { asked = url; return json({}) }) as unknown as typeof fetch
    await apiFetch(deps(makeTokens(pair('at-1', 'rt-1')), f))('https://other.example.com/x')
    expect(asked).toBe('https://other.example.com/x')
  })

  it('sends no Authorization header when no pair is stored', async () => {
    let auth: string | null = null
    const f = (async (_u: string, init?: RequestInit) => { auth = new Headers(init?.headers).get('Authorization'); return json({}) }) as unknown as typeof fetch
    await apiFetch(deps(makeTokens(null), f))('/api/v1/health')
    expect(auth).toBeNull()
  })

  it('refreshes the token once on a 401 and retries with the new pair', async () => {
    const calls: Array<{ url: string; auth: string | null }> = []
    const f = (async (url: string, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('Authorization')
      calls.push({ url, auth })
      if (url.endsWith('/app/token')) return json({ access_token: 'at-2', refresh_token: 'rt-2', expires_in: 3600 })
      // The token request carries no Authorization header; the REST call carries the old pair.
      if (url.endsWith('/api/v1/me')) return auth === 'Bearer at-1' ? json({ error: { code: 'unauthenticated', message: 'no' } }, 401) : json({ ok: true })
      return json({})
    }) as unknown as typeof fetch
    const tokens = makeTokens(pair('at-1', 'rt-1'))
    const res = await apiFetch(deps(tokens, f))('/api/v1/me')
    expect(res.ok).toBe(true)
    expect(calls.map((c) => c.auth)).toEqual(['Bearer at-1', null, 'Bearer at-2'])
    expect(await tokens.load()).toEqual(pair('at-2', 'rt-2'))
  })

  it('clears the pair and answers 401 when the refresh is refused', async () => {
    const f = (async (url: string) => {
      if (url.endsWith('/app/token')) return json({ error: { code: 'invalid_grant', message: 'reused' } }, 400)
      return json({ error: { code: 'unauthenticated', message: 'no' } }, 401)
    }) as unknown as typeof fetch
    const tokens = makeTokens(pair('at-1', 'rt-1'))
    const res = await apiFetch(deps(tokens, f))('/api/v1/me')
    expect(res.status).toBe(401)
    expect(await tokens.load()).toBeNull()
  })

  it('does not refresh on a 403 (a refused admin route)', async () => {
    let calls = 0
    const f = (async () => {
      calls += 1
      return json({ error: { code: 'admin_required', message: 'no' } }, 403)
    }) as unknown as typeof fetch
    const tokens = makeTokens(pair('at-1', 'rt-1'))
    const res = await apiFetch(deps(tokens, f))('/api/v1/users')
    expect(res.status).toBe(403)
    expect(calls).toBe(1)
    expect(await tokens.load()).toEqual(pair('at-1', 'rt-1'))
  })

  it('keeps a header the caller set', async () => {
    let ct: string | null = null
    const f = (async (_u: string, init?: RequestInit) => { ct = new Headers(init?.headers).get('Content-Type'); return json({}) }) as unknown as typeof fetch
    await apiFetch(deps(makeTokens(pair('at-1', 'rt-1')), f))('/api/v1/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    expect(ct).toBe('application/json')
  })
})

describe('origin', () => {
  it.each([
    ['https://todo.example.com', 'https://todo.example.com'],
    ['https://todo.example.com/', 'https://todo.example.com'],
    ['http://192.168.1.4:8080', 'http://192.168.1.4:8080'],
  ])('%s → %s', (input, want) => expect(origin(input)).toBe(want))
})