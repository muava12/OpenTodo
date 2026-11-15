// Reminder time arithmetic for the native app (OpenSpec change
// rn-taskito-foundation, task 5.3). Mirrors web/src/lib/reminderTime.ts
// without i18n. Pure: no imports from the data layer.
import type { Due, Reminder } from '@shared/types'

/** Due time assumed for a task that has a date but no time (local wall clock). */
export const DEFAULT_REMINDER_TIME = '09:00'

/**
 * The instant a due denotes: a floating date/time is read in this device's
 * time zone (the RN app does not support zoned due values).
 */
export function dueInstant(due: Due): number {
  const [y, m, d] = due.date.split('-').map(Number)
  const [hh, mm] = (due.time ?? DEFAULT_REMINDER_TIME).split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime()
}

/** Firing instant of a relative reminder: due time plus offset, null without a due date. */
export function relativeFireAt(due: Due | null, offsetMinutes: number | null): number | null {
  if (!due) return null
  return dueInstant(due) + (offsetMinutes ?? 0) * 60_000
}

/** Firing instant of a deadline reminder: 09:00 local on the deadline day plus offset. */
export function deadlineFireAt(deadline: string | null | undefined, offsetMinutes: number | null): number | null {
  if (!deadline) return null
  return dueInstant({ date: deadline }) + (offsetMinutes ?? 0) * 60_000
}

/** The firing that `delivered_at` acknowledges is the current one. */
export function isDelivered(r: Pick<Reminder, 'delivered_at' | 'fire_at'>): boolean {
  return r.delivered_at !== null && r.fire_at !== null && r.delivered_at >= r.fire_at
}

/** Dismissed for the current firing. */
export function isDismissed(r: Pick<Reminder, 'dismissed_at' | 'fire_at'>): boolean {
  return r.dismissed_at !== null && r.fire_at !== null && r.dismissed_at >= r.fire_at
}

/**
 * Whether a reminder should be shown now: it has fired, is live, not dismissed
 * for this firing, and its task exists and is neither completed nor deleted.
 */
export function isDue(
  r: Reminder,
  task: { completed_at: number | null; deleted_at: number | null } | undefined,
  now: number,
): boolean {
  if (r.deleted_at || r.fire_at === null || r.fire_at > now) return false
  if (isDismissed(r)) return false
  return !!task && !task.completed_at && !task.deleted_at
}

export type SnoozeChoice = '10m' | '1h' | 'tomorrow'

/** The new firing instant for a snooze choice: +10 min, +1 h, or tomorrow at 09:00 local. */
export function snoozeUntil(choice: SnoozeChoice, now: number): number {
  if (choice === '10m') return now + 10 * 60_000
  if (choice === '1h') return now + 60 * 60_000
  const d = new Date(now)
  const [hh, mm] = DEFAULT_REMINDER_TIME.split(':').map(Number)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, hh, mm, 0, 0).getTime()
}

/** Presets offered in the reminder sheet, in minutes relative to the due time. */
export const RELATIVE_PRESETS: { minutes: number; label: string }[] = [
  { minutes: 0, label: 'At due time' },
  { minutes: -10, label: '10 minutes before' },
  { minutes: -30, label: '30 minutes before' },
  { minutes: -60, label: '1 hour before' },
  { minutes: -1440, label: '1 day before' },
]

/** Deadline reminder presets: offsets from 09:00 on the deadline. */
export const DEADLINE_PRESETS: { minutes: number; label: string }[] = [
  { minutes: 0, label: 'On the deadline' },
  { minutes: -1440, label: '1 day before the deadline' },
]

/** Human label of a relative offset ("30 minutes before", "2 hours after"). */
export function offsetLabel(minutes: number | null): string {
  const m = minutes ?? 0
  if (m === 0) return 'At due time'
  const abs = Math.abs(m)
  let n: number
  let unit: string
  if (abs % 1440 === 0) {
    n = abs / 1440
    unit = abs / 1440 === 1 ? 'day' : 'days'
  } else if (abs % 60 === 0) {
    n = abs / 60
    unit = abs / 60 === 1 ? 'hour' : 'hours'
  } else {
    n = abs
    unit = abs === 1 ? 'minute' : 'minutes'
  }
  return `${n} ${unit} ${m < 0 ? 'before' : 'after'}`
}

/** Human label of a deadline reminder offset. */
export function deadlineOffsetLabel(minutes: number | null): string {
  if ((minutes ?? 0) === 0) return 'On the deadline'
  return `${offsetLabel(minutes)} the deadline`
}

/** Human label of a reminder: the offset or the absolute time. */
export function reminderLabel(r: Pick<Reminder, 'kind' | 'offset_minutes' | 'fire_at'>): string {
  if (r.kind === 'relative') return offsetLabel(r.offset_minutes)
  if (r.kind === 'deadline') return deadlineOffsetLabel(r.offset_minutes)
  if (r.fire_at !== null) return new Date(r.fire_at).toLocaleString()
  return 'Not scheduled'
}