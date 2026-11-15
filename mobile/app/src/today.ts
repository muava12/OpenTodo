// Today's rows (OpenSpec change rn-taskito-foundation, task 1.3): what the
// Today screen draws — the shared todayTasks for the rows, and the completion
// rule the row's checkbox follows. The drawing is the screen's; the deciding is
// the shared modules', as everywhere in the app.
import { todayTasks } from './storage/lists'
import { setTaskCompleted } from '@shared/ops'
import { tapComplete } from './haptics'
import type { UserPrefs } from '@shared/types'
import type { Task } from '@shared/types'

/** The row the screen draws: the task and what its checkbox does. */
export interface TodayRow {
  task: Task
  /** Completing this row completes the task and taps, unless the preference is off. */
  complete: () => Promise<void>
}

/** Today's rows in Today's order (the shared todayList). */
export async function todayRows(today: string, prefs?: Partial<UserPrefs> | null): Promise<TodayRow[]> {
  const tasks = await todayTasks(today)
  return tasks.map((task) => ({
    task,
    complete: async () => {
      await setTaskCompleted(task.id, true)
      await tapComplete(prefs ?? null)
    },
  }))
}