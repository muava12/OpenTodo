// The quick-add bar's add (OpenSpec change rn-taskito-foundation, task 4.2):
// the context rule — a task added from Today gets today, one from a project goes
// there, one from a label carries it — as the web's own create path.
import { taskFrom } from '../src/taskFrom'

describe('taskFrom', () => {
  const parsed = { title: 'Buy milk', due: null, projectId: null, labels: [], priority: null }

  it('a task from Today gets today', () => {
    const t = taskFrom(parsed, { today: '2026-11-15' })
    expect(t.due).toEqual({ date: '2026-11-15' })
  })

  it('a task from a project goes there', () => {
    const t = taskFrom(parsed, { projectId: 'p-1' })
    expect(t.project_id).toBe('p-1')
  })

  it('a task from a label carries it', () => {
    const t = taskFrom(parsed, { label: 'work' })
    expect(t.labels).toEqual(['work'])
  })

  it('the line’s own attributes win over the context', () => {
    const t = taskFrom({ ...parsed, due: { date: '2026-12-01' }, projectId: 'p-2' }, { today: '2026-11-15', projectId: 'p-1' })
    expect(t.due).toEqual({ date: '2026-12-01' })
    expect(t.project_id).toBe('p-2')
  })

  it('the default priority is 4 (none)', () => {
    expect(taskFrom(parsed, {}).priority).toBe(4)
  })

  it('the line’s priority is kept', () => {
    expect(taskFrom({ ...parsed, priority: 1 }, {}).priority).toBe(1)
  })
})