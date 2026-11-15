// The reorder rule of a manual list (OpenSpec change rn-taskito-foundation,
// task 3.5): a dragged row takes a position between its new neighbours, as the
// web's ordering rank does. The rule is pure; the write is ops'.
import { positionBetween } from '@shared/ordering'

/** A row of a manual list: its id and its position. */
export interface Ordered {
  id: string
  position: number
}

/** The new positions after moving `id` before `beforeId` (null: to the end). */
export function reorder(rows: readonly Ordered[], id: string, beforeId: string | null): Map<string, number> {
  const rest = rows.filter((r) => r.id !== id)
  const at = beforeId ? rest.findIndex((r) => r.id === beforeId) : rest.length
  if (at < 0) return new Map()
  const prev = at > 0 ? rest[at - 1].position : null
  const next = at < rest.length ? rest[at].position : null
  return new Map([[id, positionBetween(prev, next)]])
}