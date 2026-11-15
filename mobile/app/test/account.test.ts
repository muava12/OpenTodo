// The account's session (OpenSpec change rn-taskito-foundation, task 1.2): the
// fetch the shared library sees is the app's signed, server-prefixed fetch, and
// the account's database opens at sign-in. The sync engine itself is the shared
// sync.ts, which follows the platform's lifecycle; these tests pin what the app
// wires around it.
import { installPlatform, platform } from '@shared/platform'
import { resetModuleState } from '@shared/moduleState'
import { installFetch, startAccount, installSyncHooks } from '../src/account'
import { accountDatabaseName } from '../src/storage/account'
import { sqliteDatabase } from '../src/storage/adapter'
import { nodeSqlite } from './storage/nodeSqlite'

const server = 'https://todo.example.com'

beforeEach(() => {
  resetModuleState()
  // The shared db.ts constructs its Dexie at module load; the instance must see
  // the fake IndexedDB, so the globals are set before the first import (jest
  // hoists imports, so the test file sets them in a setup module instead).
  installPlatform({ ...platform, database: (declared) => sqliteDatabase(declared, nodeSqlite()) })
  ;(globalThis as Record<string, unknown>).window = {
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }
  ;(globalThis as Record<string, unknown>).document = {
    visibilityState: 'visible',
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }
})

afterEach(() => resetModuleState())

describe('installFetch', () => {
  it('replaces the global fetch with the signed, prefixed fetch', async () => {
    const seen: string[] = []
    const original = globalThis.fetch
    globalThis.fetch = (async (input: string) => { seen.push(String(input)); return new Response('{}') }) as unknown as typeof fetch
    try {
      installFetch(server)
      await (globalThis.fetch as typeof fetch)('/api/v1/me')
      expect(seen).toEqual(['https://todo.example.com/api/v1/me'])
    } finally {
      globalThis.fetch = original
    }
  })
})

describe('openAccount (the account database)', () => {
  it('names the database after the server and the account', () => {
    expect(accountDatabaseName('https://todo.example.com', 'u-1')).toMatch(/^opentodo-[0-9a-f]{8}$/)
  })
})

describe('startAccount', () => {
  it('asks the server who is signed in and opens that account', async () => {
    // The shared api.me reads the database the platform opened; the test's platform
    // is the web's over the fake host (see the module's before), so db.ts's load
    // path (fake-indexeddb) is present. The me call itself is answered by the fetch
    // the test installed.
    const calls: string[] = []
    const original = globalThis.fetch
    globalThis.fetch = (async (input: string) => {
      calls.push(String(input))
      return new Response(JSON.stringify({ user: { id: 'u-1' } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }) as unknown as typeof fetch
    try {
      const opened: string[] = []
      const started: string[] = []
      installSyncHooks({
        fetch: ((input: string) => { calls.push(String(input)); return Promise.resolve(new Response(JSON.stringify({ user: { id: 'u-1' } }), { status: 200, headers: { 'Content-Type': 'application/json' } })) }) as unknown as typeof fetch,
        openAccount: (s, u) => { opened.push(`${s}|${u}`) },
        start: () => { started.push('sync') },
      })
      await startAccount(server)
      expect(calls.some((c) => c.endsWith('/api/v1/me'))).toBe(true)
      expect(opened).toEqual([`${server}|u-1`])
      expect(started).toEqual(['sync'])
    } finally {
      globalThis.fetch = original
    }
  })
})