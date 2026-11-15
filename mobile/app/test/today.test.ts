/**
 * @jest-environment node
 */
// Today's rows (OpenSpec change rn-taskito-foundation, task 1.3): the shared
// todayTasks for the rows, and the completion rule the checkbox follows.
import Dexie from 'dexie'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { addDaysISO, refreshViewerZone } from '@shared/dates'
import { db, useDatabase as openDatabaseNamed } from '@shared/db'
import { resetModuleState } from '@shared/moduleState'
import { createTask } from '@shared/ops'
import { installPlatform, platform } from '@shared/platform'
import { todayRows } from '../src/today'
import { sqliteDatabase } from '../src/storage/adapter'
import { nodeSqlite } from './storage/nodeSqlite'

const sql = nodeSqlite()
const today = '2026-11-15'

beforeEach(() => {
  resetModuleState()
  Dexie.dependencies.indexedDB = new IDBFactory()
  Dexie.dependencies.IDBKeyRange = IDBKeyRange
  installPlatform({ ...platform, database: (declared) => sqliteDatabase(declared, sql), timeZone: { current: () => 'UTC', onChange: () => () => undefined } })
  openDatabaseNamed(`today-${Math.random()}`)
  refreshViewerZone()
})

afterEach(async () => {
  await db.tasks.clear()
  await db.projects.clear()
  resetModuleState()
})

describe('todayRows', () => {
  it('lists today’s tasks in Today’s order and completes one with a tap', async () => {
    const early = await createTask({ title: 'Early', due: { date: today, time: '08:00' } })
    const late = await createTask({ title: 'Late', due: { date: today, time: '18:00' } })
    const other = await createTask({ title: 'Tomorrow', due: { date: addDaysISO(today, 1) } })
    const noDate = await createTask({ title: 'No date' })
    expect(typeof early).toBe('string')
    expect(typeof late).toBe('string')
    expect(typeof other).toBe('string')
    expect(typeof noDate).toBe('string')

    const rows = await todayRows(today)
    expect(rows.map((r) => r.task.title)).toEqual(['Early', 'Late'])
    expect(rows.map((r) => r.task.id)).not.toContain(other)
    expect(rows.map((r) => r.task.id)).not.toContain(noDate)

    await rows[0].complete()
    const done = await db.tasks.get(early)
    const open = await db.tasks.get(late)
    expect(typeof done?.completed_at).toBe('number')
    expect(open?.completed_at ?? null).toBeNull()
  })

  it('keeps the rows after a completion (the next list read drops it)', async () => {
    const t = await createTask({ title: 'One', due: { date: today } })
    const rows = await todayRows(today)
    await rows[0].complete()
    const after = await todayRows(today)
    expect(after.map((r) => r.task.id)).not.toContain(t)
  })
})