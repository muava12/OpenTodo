// The bottom padding of a list (OpenSpec change rn-taskito-foundation, task
// 3.7): the list leaves room for the quick-add bar and the keyboard, so the
// last row is always reachable. The rule is pure.

/** The padding a list's content needs at its bottom. */
export function bottomPadding(input: {
  keyboard: boolean
  barHeight: number
  keyboardHeight?: number
}): number {
  return input.barHeight + (input.keyboard ? input.keyboardHeight ?? 0 : 0)
}