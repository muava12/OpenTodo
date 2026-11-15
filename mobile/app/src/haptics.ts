// The completion tap (OpenSpec change rn-taskito-foundation, task 1.3): the
// shared library's haptics preference (web/src/lib/haptics.ts) decides whether
// the app taps at all; the platform's motor is expo-haptics. The tap is a light
// success notification, as on the web's own completion.
import * as Haptics from 'expo-haptics'
import { hapticsPrefOn } from '@shared/haptics'

/** Tap once when a task is completed, if the preference allows it. */
export async function tapComplete(prefs: Parameters<typeof hapticsPrefOn>[0]): Promise<void> {
  if (!hapticsPrefOn(prefs)) return
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined)
}