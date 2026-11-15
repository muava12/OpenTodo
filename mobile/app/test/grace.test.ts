// The completion grace period and Undo (OpenSpec change
// rn-taskito-foundation, task 3.4): a completed row stays for a moment with
// Undo, then folds away. The rule is pure; the screen's timer is its own.
import { completion, gracePeriod } from '../src/grace'

describe('gracePeriod', () => {
  const t0 = 1_800_000_000_000

  it('keeps a completion for the grace period, then drops it', () => {
    const g = gracePeriod(t0, 5_000)
    expect(g.holds(t0 + 1_000)).toBe(true)
    expect(g.holds(t0 + 5_001)).toBe(false)
  })

  it('an Undo within the period puts the row back', () => {
    const g = gracePeriod(t0, 5_000)
    expect(g.undo(t0 + 1_000)).toBe('restored')
    expect(g.undo(t0 + 5_001)).toBe('expired')
  })

  it('an Undo after the period is expired', () => {
    const g = gracePeriod(t0, 5_000)
    expect(g.undo(t0 + 6_000)).toBe('expired')
  })

  it('the period is the one the screen was given', () => {
    const g = gracePeriod(t0, 10_000)
    expect(g.holds(t0 + 9_999)).toBe(true)
  })
})

describe('a completion', () => {
  it('the row is completed, and Undo un-completes it', async () => {
    const calls: string[] = []
    const api = {
      complete: async (id: string) => { calls.push(`complete:${id}`) },
      reopen: async (id: string) => { calls.push(`reopen:${id}`) },
    }
    const c = completion('t-1', api)
    await c.complete()
    await c.undo()
    expect(calls).toEqual(['complete:t-1', 'reopen:t-1'])
  })
})