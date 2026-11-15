// The count cards (OpenSpec change rn-taskito-foundation, task 3.3): Remaining
// (today's open tasks), Overdue, and Unplanned (open tasks with no due date and
// no project). The counts come from the shared rows; the rule is pure.

/** The fields a row needs for the count. */
export interface CountInput {
  task: { id: string; due?: { date: string } | null; project_id?: string | null }
}

/** The three card counts. */
export interface Counts {
  remaining: number
  overdue: number
  unplanned: number
}

/** The counts of a list of rows on `today`. */
export function counts(rows: readonly CountInput[], today: string): Counts {
  let remaining = 0
  let overdue = 0
  let unplanned = 0
  for (const { task } of rows) {
    const due = task.due?.date ?? null
    if (!due) {
      if (!task.project_id) unplanned += 1
    } else if (due === today) remaining += 1
    else if (due < today) overdue += 1
  }
  return { remaining, overdue, unplanned }
}