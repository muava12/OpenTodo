// The context menu of a row and the bulk toolbar (OpenSpec change
// rn-taskito-foundation, task 3.5): the actions a long-press offers, and the
// actions the edit mode offers. The menu is the screen's; the action list is
// pure so it is tested without a screen.

/** An action of the context menu or the bulk toolbar. */
export interface ContextAction {
  id: 'schedule' | 'move' | 'priority' | 'labels' | 'duplicate' | 'copy-link' | 'delete' | 'complete'
  label: string
  destructive: boolean
}

const ROW: readonly ContextAction[] = [
  { id: 'schedule', label: 'Schedule', destructive: false },
  { id: 'move', label: 'Move', destructive: false },
  { id: 'priority', label: 'Priority', destructive: false },
  { id: 'labels', label: 'Labels', destructive: false },
  { id: 'duplicate', label: 'Duplicate', destructive: false },
  { id: 'copy-link', label: 'Copy link', destructive: false },
  { id: 'delete', label: 'Delete', destructive: true },
]

const BULK: readonly ContextAction[] = [
  { id: 'complete', label: 'Complete', destructive: false },
  { id: 'schedule', label: 'Schedule', destructive: false },
  { id: 'move', label: 'Move', destructive: false },
  { id: 'delete', label: 'Delete', destructive: true },
]

/** The actions of a row's context menu, or of the bulk toolbar. */
export function contextActions(kind: 'row' | 'bulk' = 'row'): ContextAction[] {
  return [...(kind === 'bulk' ? BULK : ROW)]
}