// The quick-add bar's add (OpenSpec change rn-taskito-foundation, task 4.2):
// the context rule — a task added from Today gets today, one from a project goes
// there, one from a label carries it — as the web's own create path. The rule is
// pure; the write is ops'.
import type { Due } from '@shared/types'

/** Where the bar was opened. */
export interface BarContext {
  /** The list's date, or null on a list without one. */
  today?: string | null
  /** The project the bar is in, or null. */
  projectId?: string | null
  /** The label the bar is in, or null. */
  label?: string | null
}

/** The task a parsed line creates in a context. */
export function taskFrom(
  parsed: { title: string; due: Due | null; projectId: string | null; labels: string[]; priority: number | null },
  ctx: BarContext,
): { title: string; due: Due | null; project_id: string | null; labels: string[]; priority: number } {
  return {
    title: parsed.title,
    due: parsed.due ?? (ctx.today ? { date: ctx.today } : null),
    project_id: parsed.projectId ?? ctx.projectId ?? null,
    labels: [...new Set([...parsed.labels, ...(ctx.label ? [ctx.label] : [])])],
    priority: parsed.priority ?? 4,
  }
}