// Widget model publication (OpenSpec change rn-taskito-foundation, task 7.3):
// the publish payload, the Today filter, and the row format.
import { buildWidgetModel, widgetPayload, WIDGET_MAX, type WidgetModel } from '../src/widgetPublish'
import type { Task } from '@shared/types'

const task = (over: Partial<Task> = {}): Task =>
  ({
    id: 't-1', title: 'T', description: null, project_id: null, parent_id: null,
    priority: 4, due: null, deadline: null, labels: [], position: 0,
    created_at: 1, updated_at: 1, deleted_at: null, ...over,
  } as Task)

describe('buildWidgetModel', () => {
  it('includes tasks due today', () => {
    const tasks = [task({ id: 'a', due: { date: '2026-11-15' } })]
    const model = buildWidgetModel(tasks, '2026-11-15', 1000)
    expect(model.count).toBe(1)
    expect(model.tasks[0].id).toBe('a')
  })

  it('includes overdue tasks', () => {
    const tasks = [task({ id: 'a', due: { date: '2026-11-14' } })]
    const model = buildWidgetModel(tasks, '2026-11-15', 1000)
    expect(model.count).toBe(1)
    expect(model.tasks[0].overdue).toBe(true)
    expect(model.overdue).toBe(1)
  })

  it('excludes completed tasks', () => {
    const tasks = [task({ id: 'a', due: { date: '2026-11-15' }, completed_at: 1000 })]
    const model = buildWidgetModel(tasks, '2026-11-15', 1000)
    expect(model.count).toBe(0)
  })

  it('excludes deleted tasks', () => {
    const tasks = [task({ id: 'a', due: { date: '2026-11-15' }, deleted_at: 1000 })]
    const model = buildWidgetModel(tasks, '2026-11-15', 1000)
    expect(model.count).toBe(0)
  })

  it('excludes tasks due in the future', () => {
    const tasks = [task({ id: 'a', due: { date: '2026-11-20' } })]
    const model = buildWidgetModel(tasks, '2026-11-15', 1000)
    expect(model.count).toBe(0)
  })

  it('includes the time when set', () => {
    const tasks = [task({ id: 'a', due: { date: '2026-11-15', time: '10:30' } })]
    const model = buildWidgetModel(tasks, '2026-11-15', 1000)
    expect(model.tasks[0].time).toBe('10:30')
  })

  it('omits the time when not set', () => {
    const tasks = [task({ id: 'a', due: { date: '2026-11-15' } })]
    const model = buildWidgetModel(tasks, '2026-11-15', 1000)
    expect(model.tasks[0].time).toBeUndefined()
  })

  it('includes the priority', () => {
    const tasks = [task({ id: 'a', priority: 1, due: { date: '2026-11-15' } })]
    const model = buildWidgetModel(tasks, '2026-11-15', 1000)
    expect(model.tasks[0].priority).toBe(1)
  })

  it('hides titles when locked', () => {
    const tasks = [task({ id: 'a', title: 'Secret', due: { date: '2026-11-15' } })]
    const model = buildWidgetModel(tasks, '2026-11-15', 1000, true)
    expect(model.tasks).toEqual([])
    expect(model.count).toBe(1)
    expect(model.locked).toBe(true)
  })

  it('caps at WIDGET_MAX rows', () => {
    const tasks = Array.from({ length: 60 }, (_, i) =>
      task({ id: `t-${i}`, due: { date: '2026-11-15' } }),
    )
    const model = buildWidgetModel(tasks, '2026-11-15', 1000)
    expect(model.tasks.length).toBe(WIDGET_MAX)
    expect(model.count).toBe(60)
  })

  it('sorts by due date then priority', () => {
    const tasks = [
      task({ id: 'c', priority: 4, due: { date: '2026-11-15' } }),
      task({ id: 'a', priority: 1, due: { date: '2026-11-15' } }),
      task({ id: 'b', priority: 2, due: { date: '2026-11-15' } }),
    ]
    const model = buildWidgetModel(tasks, '2026-11-15', 1000)
    expect(model.tasks.map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })

  it('sets updatedAt to now', () => {
    const model = buildWidgetModel([], '2026-11-15', 12345)
    expect(model.updatedAt).toBe(12345)
  })
})

describe('widgetPayload', () => {
  it('serializes to JSON', () => {
    const model: WidgetModel = {
      updatedAt: 1000,
      locked: false,
      count: 1,
      overdue: 0,
      tasks: [{ id: 'a', title: 'Test', priority: 4, overdue: false }],
    }
    const json = widgetPayload(model)
    const parsed = JSON.parse(json)
    expect(parsed.updatedAt).toBe(1000)
    expect(parsed.tasks[0].id).toBe('a')
  })

  it('the payload matches the WidgetModel.kt format', () => {
    const tasks = [task({ id: 'a', title: 'T', due: { date: '2026-11-15', time: '10:00' } })]
    const model = buildWidgetModel(tasks, '2026-11-15', 1000)
    const parsed = JSON.parse(widgetPayload(model))
    // WidgetModel.kt expects: updatedAt, locked, count, overdue, tasks
    expect(parsed).toHaveProperty('updatedAt')
    expect(parsed).toHaveProperty('locked')
    expect(parsed).toHaveProperty('count')
    expect(parsed).toHaveProperty('overdue')
    expect(parsed).toHaveProperty('tasks')
    // Each task row: id, title, time, priority, overdue
    const row = parsed.tasks[0]
    expect(row).toHaveProperty('id')
    expect(row).toHaveProperty('title')
    expect(row).toHaveProperty('time')
    expect(row).toHaveProperty('priority')
    expect(row).toHaveProperty('overdue')
  })
})