// The fake IndexedDB globals, installed before any shared module loads (the
// shared db.ts constructs its Dexie at module import time; the jest-expo preset
// gives the app no IndexedDB, so the tests that open a database install it here).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'

const g = globalThis as Record<string, unknown>
g.indexedDB = new IDBFactory()
g.IDBKeyRange = IDBKeyRange
