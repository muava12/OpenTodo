// The completion grace period and Undo (OpenSpec change
// rn-taskito-foundation, task 3.4): a completed row stays for a moment with
// Undo, then folds away. The rule is pure; the screen's timer is its own.

/** What the row's actions do to the task. */
export interface CompletionApi {
  complete(id: string): Promise<void>
  reopen(id: string): Promise<void>
}

/** The grace period of a completion, from its time. */
export interface Grace {
  /** Whether the row is still held at `now`. */
  holds(now: number): boolean
  /** Undo within the period, or expired. */
  undo(now: number): 'restored' | 'expired'
}

/** The grace period of a completion at `completedAt`, lasting `ms`. */
export function gracePeriod(completedAt: number, ms: number): Grace {
  const until = completedAt + ms
  let restored = false
  return {
    holds(now) {
      return !restored && now < until
    },
    undo(now) {
      if (now >= until) return 'expired'
      restored = true
      return 'restored'
    },
  }
}

/** A completion with its Undo: complete the task, reopen it when undone. */
export function completion(id: string, api: CompletionApi) {
  return {
    async complete() {
      await api.complete(id)
    },
    async undo() {
      await api.reopen(id)
    },
  }
}