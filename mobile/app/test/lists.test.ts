/**
 * @jest-environment node
 */
// The list screens from the shared selectors (OpenSpec change
// rn-taskito-foundation, task 3.1): Today from the shared todayTasks, Inbox from
// inboxList, Upcoming as the next 14 days' tasks — the same lists the web shows.
import Dexie from 'dexie'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { addDaysISO, refreshViewerZone } from '@shared/dates'
import { db, useDatabase as openDatabaseNamed } from '@shared/db'
import { resetModuleState } from '@shared/moduleState'
import { createTask, createProject } from '@shared/ops'
import { installPlatform, platform } from '@shared/platform'
import { todayRows } from '../src/today'
import { inboxRows, upcomingRows } from '../src/lists'
import { sqliteDatabase } from '../src/storage/adapter'
import { nodeSqlite } from './storage/nodeSqlite'

const sql = nodeSqlite()
const today = '2026-11-15'

beforeEach(() => {
  resetModuleState()
  Dexie.dependencies.indexedDB = new IDBFactory()
  Dexie.dependencies.IDBKeyRange = IDBKeyRange
  installPlatform({ ...platform, database: (declared) => sqliteDatabase(declared, sql), timeZone: { current: () => 'UTC', onChange: () => () => undefined } })
  openDatabaseNamed(`lists-${Math.random()}`)
  refreshViewerZone()
})

afterEach(async () => {
  await db.tasks.clear()
  await db.projects.clear()
  resetModuleState()
})

describe('inboxRows', () => {
  it('lists open tasks without a project', async () => {
    const a = await createTask({ title: 'Inbox one' })
    const b = await createTask({ title: 'Inbox two' })
    const rows = await inboxRows()
    expect(rows.map((r) => r.task.id).sort()).toEqual([a, b].sort())
  })

  it('leaves out a task with a project', async () => {
    const p = await createProject({ name: 'P' })
    await createTask({ title: 'In project', project_id: p })
    const rows = await inboxRows()
    expect(rows).toHaveLength(0)
  })
})

describe('upcomingRows', () => {
  it('lists the next 14 days from today', async () => {
    const tomorrow = await createTask({ title: 'Tomorrow', due: { date: addDaysISO(today, 1) } })
    const in14 = await createTask({ title: 'In 14', due: { date: addDaysISO(today, 14) } })
    const in15 = await createTask({ title: 'In 15', due: { date: addDaysISO(today, 15) } })
    const rows = await upcomingRows(today)
    expect(rows.map((r) => r.task.id).sort()).toEqual([tomorrow, in14].sort())
    expect(rows.map((r) => r.task.id)).not.toContain(in15)
  })

  it('is empty when nothing is dated', async () => {
    await createTask({ title: 'No date' })
    expect(await upcomingRows(today)).toHaveLength(0)
  })
})

describe('todayRows (the shared selector)', () => {
  it('lists today’s tasks in Today’s order', async () => {
    const early = await createTask({ title: 'Early', due: { date: today, time: '08:00' } })
    const late = await createTask({ title: 'Late', due: { date: today, time: '18:00' } })
    const rows = await todayRows(today)
    expect(rows.map((r) => r.task.id)).toEqual([early, late])
  })
})