// Widget model publication for the native app (OpenSpec change
// rn-taskito-foundation, task 7.3). Builds the Today list the widget
// shows and hands it to the Android WidgetStore. Mirrors
// web/src/lib/shellPublish.ts shellWidget().
import type { Task } from '@shared/types'

/** The widget model the Android WidgetStore expects. */
export interface WidgetModel {
  updatedAt: number
  locked: boolean
  count: number
  overdue: number
  tasks: WidgetRow[]
}

/** One row of the widget. */
export interface WidgetRow {
  id: string
  title?: string
  time?: string
  priority: number
  overdue: boolean
}

/** The maximum rows the widget shows. */
export const WIDGET_MAX = 50

/**
 * Build the widget model from the task list. Mirrors shellWidget():
 * - Filter to live, not-completed tasks due today or overdue
 * - Sort by due date then priority (the same order as the Today screen)
 * - Take the first WIDGET_MAX rows
 * - Count the overdue rows
 */
export function buildWidgetModel(
  tasks: readonly Task[],
  today: string,
  now: number,
  locked = false,
): WidgetModel {
  const live = tasks.filter((t) => !t.deleted_at && !t.completed_at)
  const todayTasks = live.filter((t) => inToday(t, today))
  const sorted = [...todayTasks].sort(compareDueThenPriority)

  const rows: WidgetRow[] = sorted.slice(0, WIDGET_MAX).map((t) => {
    const due = t.due
    const overdue = !!due && due.date < today
    return {
      id: t.id,
      ...(locked ? {} : { title: t.title }),
      ...(due?.time && !locked ? { time: due.time } : {}),
      priority: t.priority,
      overdue,
    }
  })

  return {
    updatedAt: now,
    locked,
    count: todayTasks.length,
    overdue: rows.filter((r) => r.overdue).length,
    tasks: locked ? [] : rows,
  }
}

/** Whether a task is in today: due today, overdue, or started. */
function inToday(task: Task, today: string): boolean {
  if (task.completed_at) return false
  if (task.due && task.due.date <= today) return true
  // A task with a start date that is today or earlier
  if (task.start && task.start <= today) return true
  return false
}

/** Sort by due date then priority (the same order as the Today screen). */
function compareDueThenPriority(a: Task, b: Task): number {
  const ad = a.due?.date ?? '9999-12-31'
  const bd = b.due?.date ?? '9999-12-31'
  if (ad !== bd) return ad < bd ? -1 : 1
  // Priority 1 is highest, 4 is lowest
  if (a.priority !== b.priority) return a.priority - b.priority
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/**
 * The JSON payload to hand to the Android WidgetStore.publish().
 */
export function widgetPayload(model: WidgetModel): string {
  return JSON.stringify(model)
}