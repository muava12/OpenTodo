// The offline status line and the sync state (OpenSpec change
// rn-taskito-foundation, task 3.6): the line a list shows when the device is
// offline or syncing. The rule is pure; the screen's subscription is its own.

import type { SyncState } from '@shared/types'

/** The sync state the line reads. */
export interface SyncStateInput {
  state: SyncState
  pending: number
}

/** The status line, or '' when nothing is happening. */
export function statusLine(input: SyncStateInput): string {
  if (input.state === 'offline') return 'Offline'
  if (input.state === 'syncing' || input.state === 'reseeding') return 'Syncing…'
  if (input.pending === 1) return '1 change waiting'
  if (input.pending > 1) return `${input.pending} changes waiting`
  return ''
}