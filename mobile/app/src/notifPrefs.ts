// Notification preferences for the native app (OpenSpec change
// rn-taskito-foundation, task 6.2). The settings the user can change in
// Settings → Notifications: the sticky capture notification, the snooze
// option and its length, the Done action, and the custom sound.
//
// These are stored in the Android SharedPreferences (Prefs.kt) and read
// by the Notifier to filter the notification actions. The RN app reads
// and writes them through the bridge.

/** The snooze lengths the user can pick. */
export type SnoozeLength = '10m' | '1h' | 'tomorrow'

/** The notification preferences. */
export interface NotificationPrefs {
  /** Whether the sticky capture notification is shown. */
  captureEnabled: boolean
  /** Whether the Snooze action appears on reminder notifications. */
  showSnooze: boolean
  /** The snooze length. */
  snoozeLength: SnoozeLength
  /** Whether the Done action appears on reminder notifications. */
  showDone: boolean
  /** Whether a custom sound plays through the silent-twin channel. */
  customSound: boolean
}

/** The defaults: Snooze and Done on, 10 minutes, no capture, no custom sound. */
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  captureEnabled: false,
  showSnooze: true,
  snoozeLength: '10m',
  showDone: true,
  customSound: false,
}

/** The snooze length labels. */
export const SNOOZE_LENGTH_LABELS: Record<SnoozeLength, string> = {
  '10m': '10 minutes',
  '1h': '1 hour',
  tomorrow: 'Tomorrow at 09:00',
}

/**
 * The notification actions a reminder should show, given the preferences.
 * Done first, then Snooze, then Dismiss (Dismiss is always present).
 */
export function reminderActions(prefs: NotificationPrefs): string[] {
  const actions: string[] = []
  if (prefs.showDone) actions.push('done')
  if (prefs.showSnooze) actions.push('snooze')
  actions.push('dismiss')
  return actions
}

/**
 * Parse a snooze length string to a SnoozeLength, defaulting to '10m'.
 */
export function parseSnoozeLength(s: string): SnoozeLength {
  if (s === '1h' || s === 'tomorrow') return s
  return '10m'
}

/**
 * Map the snooze length to the snooze milliseconds from now.
 */
export function snoozeMs(length: SnoozeLength, now: number): number {
  if (length === '10m') return now + 10 * 60_000
  if (length === '1h') return now + 60 * 60_000
  // Tomorrow at 09:00 local
  const d = new Date(now)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 9, 0, 0, 0).getTime()
}