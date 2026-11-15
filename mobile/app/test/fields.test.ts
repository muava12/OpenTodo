// The task detail's fields (OpenSpec change rn-taskito-foundation, task 5.1):
// the grouped rows the detail shows, and which collapse into one "Add…" row on
// a fresh task.
import { fieldRows, collapses } from '../src/fields'
import type { Reminder, Task } from '@shared/types'

const task = (over: Partial<Task> = {}): Task =>
  ({ id: 't-1', title: 'T', description: null, project_id: null, parent_id: null, priority: 4, due: null, deadline: null, labels: [], position: 0, created_at: 1, updated_at: 1, deleted_at: null, ...over } as Task)

describe('fieldRows', () => {
  it('shows a due date and time', () => {
    const rows = fieldRows(task({ due: { date: '2026-11-15', time: '10:00' } }))
    expect(rows.find((r) => r.kind === 'when')?.value).toBe('2026-11-15 10:00')
  })

  it('shows a date only', () => {
    const rows = fieldRows(task({ due: { date: '2026-11-15' } }))
    expect(rows.find((r) => r.kind === 'when')?.value).toBe('2026-11-15')
  })

  it('an unset field is empty', () => {
    const rows = fieldRows(task())
    expect(rows.find((r) => r.kind === 'when')?.value).toBe('')
  })

  it('the default priority is empty', () => {
    const rows = fieldRows(task())
    expect(rows.find((r) => r.kind === 'priority')?.value).toBe('')
  })

  it('a set priority shows', () => {
    const rows = fieldRows(task({ priority: 1 }))
    expect(rows.find((r) => r.kind === 'priority')?.value).toBe('p1')
  })

  it('labels are joined', () => {
    const rows = fieldRows(task({ labels: ['a', 'b'] }))
    expect(rows.find((r) => r.kind === 'labels')?.value).toBe('a, b')
  })

  it('shows a reminder offset', () => {
    const reminders = [{ id: 'r-1', task_id: 't-1', kind: 'relative', offset_minutes: -30, fire_at: null, delivered_at: null, dismissed_at: null, created_at: 1, deleted_at: null }] as Reminder[]
    const rows = fieldRows(task(), reminders)
    expect(rows.find((r) => r.kind === 'reminders')?.value).toBe('30 minutes before')
  })

  it('no reminders is empty', () => {
    const rows = fieldRows(task(), [])
    expect(rows.find((r) => r.kind === 'reminders')?.value).toBe('')
  })

  it('no reminders argument is empty', () => {
    const rows = fieldRows(task())
    expect(rows.find((r) => r.kind === 'reminders')?.value).toBe('')
  })
})

describe('collapses', () => {
  it('a fresh task collapses', () => {
    expect(collapses(fieldRows(task()))).toBe(true)
  })

  it('a task with a field does not collapse', () => {
    expect(collapses(fieldRows(task({ due: { date: '2026-11-15' } })))).toBe(false)
  })
})