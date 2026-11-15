// The sign-in session: the sheet, the redirect, the code exchange and the token
// storage (OpenSpec change rn-taskito-foundation, design D5 of the foundation).
import { pkcePair, REDIRECT, type TokenAnswer } from '../src/signIn'
import { signIn, type Sheet, type SignInDeps } from '../src/signInSession'
import { tokenStore, type TokenStorage } from '../src/tokenStore'

const server = 'https://todo.example.com'
const pair = { access_token: 'at-1', refresh_token: 'rt-1', expires_in: 3600 }

const makeStorage = () => {
  const map = new Map<string, string>()
  const storage: TokenStorage = {
    read: (k) => map.get(k) ?? null,
    write: (k, v) => { map.set(k, v) },
    clear: (k) => { map.delete(k) },
  }
  return { storage, map }
}

const answer = (a: TokenAnswer): typeof fetch => (async () => {
  if (a.ok) return new Response(JSON.stringify(a.tokens), { status: 200 })
  return new Response(JSON.stringify({ error: { code: a.problem, message: 'no' } }), { status: 400 })
}) as unknown as typeof fetch

describe('signIn', () => {
  const deps = (sheet: Sheet, f: typeof fetch, storage = makeStorage().storage): SignInDeps => ({
    sheet,
    fetch: f,
    tokens: tokenStore(storage),
    device: () => 'Pixel 9',
    verifier: () => ({ verifier: 'v-1', challenge: 'chal-1' }),
    state: () => 'st-1',
  })

  it('opens the confirmation URL and stores the pair after a redirect', async () => {
    const openedUrl: string[] = []
    const sheet: Sheet = {
      open: async (url: string) => { openedUrl.push(url); return { type: 'success', url: `${REDIRECT}?code=code-1&state=st-1` } },
    }
    const { storage } = makeStorage()
    const r = await signIn({ server, device: 'Pixel 9' }, deps(sheet, answer({ ok: true, tokens: pair }), storage))
    expect(r).toEqual({ ok: true, tokens: pair })
    const opened = new URL(openedUrl[0])
    expect(opened.origin + opened.pathname).toBe('https://todo.example.com/app/sign-in')
    expect(opened.searchParams.get('code_challenge')).toBe('chal-1')
    expect(opened.searchParams.get('code_challenge_method')).toBe('S256')
    expect(opened.searchParams.get('state')).toBe('st-1')
    expect(opened.searchParams.get('device')).toBe('Pixel 9')
    expect(await tokenStore(storage).load()).toEqual(pair)
  })

  it('refuses a redirect with a state the session did not send', async () => {
    const sheet: Sheet = { open: async () => ({ type: 'success', url: `${REDIRECT}?code=code-1&state=other` }) }
    const r = await signIn({ server, device: 'Pixel 9' }, deps(sheet, answer({ ok: true, tokens: pair })))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.problem).toBe('state')
  })

  it('refuses a redirect with no code', async () => {
    const sheet: Sheet = { open: async () => ({ type: 'success', url: `${REDIRECT}?state=st-1` }) }
    const r = await signIn({ server, device: 'Pixel 9' }, deps(sheet, answer({ ok: true, tokens: pair })))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.problem).toBe('code')
  })

  it('answers invalid_grant when the server refuses the code', async () => {
    const sheet: Sheet = { open: async () => ({ type: 'success', url: `${REDIRECT}?code=code-1&state=st-1` }) }
    const r = await signIn({ server, device: 'Pixel 9' }, deps(sheet, answer({ ok: false, problem: 'invalid_grant' })))
    expect(r).toEqual({ ok: false, problem: 'invalid_grant' })
  })

  it('answers cancelled when the user closes the sheet', async () => {
    const sheet: Sheet = { open: async () => ({ type: 'cancel' }) }
    const r = await signIn({ server, device: 'Pixel 9' }, deps(sheet, answer({ ok: true, tokens: pair })))
    expect(r).toEqual({ ok: false, problem: 'cancelled' })
  })

  it('answers error when the sheet cannot open', async () => {
    const sheet: Sheet = { open: async () => ({ type: 'error', error: 'no browser' }) }
    const r = await signIn({ server, device: 'Pixel 9' }, deps(sheet, answer({ ok: true, tokens: pair })))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.problem).toBe('sheet')
  })

  it('does not call the token route when the redirect is not the app scheme', async () => {
    let called = false
    const f = (async () => { called = true; return new Response('{}') }) as unknown as typeof fetch
    const sheet: Sheet = { open: async () => ({ type: 'success', url: 'https://todo.example.com/app/sign-in?code=x' }) }
    await signIn({ server, device: 'Pixel 9' }, deps(sheet, f))
    expect(called).toBe(false)
  })
})

// The verifier and challenge are injected in the tests above; this keeps the import of
// pkcePair meaningful for the app's own use (the default implementation in src/signInSession).
export const verifier = pkcePair