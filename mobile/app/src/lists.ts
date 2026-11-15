// The list screens' rows (OpenSpec change rn-taskito-foundation, task 3.1): the
// shared selectors for each list, and the completion rule each row follows. The
// deciding is the shared modules'; the drawing is the screens'.
import { addDaysISO } from '@shared/dates'
import { db } from '@shared/db'
import { withoutArchived } from '@shared/dayLists'
import { inboxList, todayTasks } from './storage/lists'
import { deletedProjectIds, isTaskVisible } from '@shared/trash'
import { readWorkspaceState, tasksIn } from '@shared/workspaces'
import { setTaskCompleted } from '@shared/ops'
import { tapComplete } from './haptics'
import { columnOf } from './storage/schema'
import type { Task } from '@shared/types'

/** The row a screen draws: the task and what its checkbox does. */
export interface Row {
  task: Task
  complete: () => Promise<void>
}

/** The completion rule a row follows: complete, then tap. */
async function completeTask(task: Task): Promise<void> {
  await setTaskCompleted(task.id, true)
  await tapComplete(null)
}

/** The Inbox: open tasks without a project (the shared inboxTasks). */
export async function inboxRows(): Promise<Row[]> {
  const tasks = await inboxList()
  return tasks.map((task) => ({ task, complete: () => completeTask(task) }))
}

/** The dated open tasks in the next 14 days, in due order (the shared rules over the index). */
async function allDated(today: string): Promise<Task[]> {
  const open = `${columnOf('completed_at')} IS NULL`
  const candidates = (await (db.tasks as unknown as { select(where: string, params: string[]): Promise<Task[]> }).select(
    `${open} AND ${columnOf('due.date')} BETWEEN ? AND ?`,
    [today, addDaysISO(today, 14)],
  )) as Task[]
  const projects = await db.projects.toArray()
  const state = await readWorkspaceState()
  const gone = deletedProjectIds(projects)
  const known = tasksIn(state, projects, candidates.filter((x) => isTaskVisible(x, gone)))
  return withoutArchived(known, projects).sort((a, b) => (a.due?.date ?? '').localeCompare(b.due?.date ?? ''))
}

/** The next 14 days from `today`, in due order (the shared date rule). */
export async function upcomingRows(today: string): Promise<Row[]> {
  const tasks = await allDated(today)
  return tasks.map((task) => ({ task, complete: () => completeTask(task) }))
}

/** Today's rows (the shared todayTasks); the screen uses this too. */
export async function todayListRows(today: string): Promise<Row[]> {
  const tasks = await todayTasks(today)
  return tasks.map((task) => ({ task, complete: () => completeTask(task) }))
}