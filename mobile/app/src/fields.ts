// The task detail's fields (OpenSpec change rn-taskito-foundation, task 5.1):
// the grouped rows the detail shows, and which collapse into one "Add…" row on
// a fresh task. The rule is pure; the screen is the screen's.
import type { Task } from '@shared/types'

/** The rows of the task detail, in order. */
export interface FieldRow {
  kind: 'when' | 'deadline' | 'project' | 'labels' | 'priority' | 'reminders' | 'repeat'
  /** The text the row shows; '' when unset. */
  value: string
}

/** The fields a task has set. */
export function fieldRows(task: Task): FieldRow[] {
  const rows: FieldRow[] = []
  rows.push({ kind: 'when', value: dueText(task) })
  rows.push({ kind: 'deadline', value: task.deadline ?? '' })
  rows.push({ kind: 'project', value: task.project_id ?? '' })
  rows.push({ kind: 'labels', value: (task.labels ?? []).join(', ') })
  rows.push({ kind: 'priority', value: task.priority === 4 ? '' : `p${task.priority}` })
  rows.push({ kind: 'reminders', value: '' })
  rows.push({ kind: 'repeat', value: task.recurrence ?? '' })
  return rows
}

/** The due text of a task, or ''. */
function dueText(task: Task): string {
  const d = task.due
  if (!d) return ''
  return d.time ? `${d.date} ${d.time}` : d.date
}

/** Whether the detail collapses the unset rows into one "Add…" row. */
export function collapses(rows: readonly FieldRow[]): boolean {
  return rows.every((r) => r.value === '')
}