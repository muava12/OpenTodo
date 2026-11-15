/**
 * @jest-environment node
 */
// The count cards (OpenSpec change rn-taskito-foundation, task 3.3): Remaining
// (today's open tasks), Overdue, and Unplanned (open tasks with no due date and
// no project). The counts come from the shared rows; the rule is pure.
import { counts, type CountInput } from '../src/counts'

describe('counts', () => {
  const today = '2026-11-15'
  const row = (id: string, due?: string | null, projectId?: string | null) =>
    ({ task: { id, due: due ? { date: due } : null, project_id: projectId ?? null } }) as CountInput

  it('counts today’s open tasks as Remaining', () => {
    const c = counts([
      row('a', today),
      row('b', today),
      row('c', '2026-11-20'),
    ], today)
    expect(c.remaining).toBe(2)
  })

  it('counts overdue as the open tasks before today', () => {
    const c = counts([
      row('a', '2026-11-14'),
      row('b', '2026-11-13'),
      row('c', today),
    ], today)
    expect(c.overdue).toBe(2)
  })

  it('counts unplanned as the open tasks with no date and no project', () => {
    const c = counts([
      row('a', null, null),
      row('b', null, null),
      row('c', null, 'p-1'),
    ], today)
    expect(c.unplanned).toBe(2)
  })

  it('is zero on an empty list', () => {
    expect(counts([], today)).toEqual({ remaining: 0, overdue: 0, unplanned: 0 })
  })

  it('a task is in one card only', () => {
    const c = counts([row('a', '2026-11-14'), row('b', today), row('c', null, null)], today)
    expect(c.remaining).toBe(1)
    expect(c.overdue).toBe(1)
    expect(c.unplanned).toBe(1)
  })
})