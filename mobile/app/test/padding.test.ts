// The bottom padding of a list (OpenSpec change rn-taskito-foundation, task
// 3.7): the list leaves room for the quick-add bar and the keyboard, so the
// last row is always reachable. The rule is pure.
import { bottomPadding } from '../src/padding'

describe('bottomPadding', () => {
  it('leaves the bar’s height when the keyboard is down', () => {
    expect(bottomPadding({ keyboard: false, barHeight: 56 })).toBe(56)
  })

  it('leaves the bar plus the keyboard when it is up', () => {
    expect(bottomPadding({ keyboard: true, barHeight: 56, keyboardHeight: 300 })).toBe(356)
  })

  it('is zero when there is no bar', () => {
    expect(bottomPadding({ keyboard: false, barHeight: 0 })).toBe(0)
  })

  it('a keyboard alone leaves its height', () => {
    expect(bottomPadding({ keyboard: true, barHeight: 0, keyboardHeight: 300 })).toBe(300)
  })
})