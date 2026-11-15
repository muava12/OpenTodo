// The context menu of a row (OpenSpec change rn-taskito-foundation, task 3.5):
// the actions a long-press offers. The menu is the screen's; the action list is
// pure so it is tested without a screen.
import { contextActions } from '../src/contextMenu'

describe('contextActions', () => {
  it('offers the actions of design D3', () => {
    const a = contextActions()
    expect(a.map((x) => x.id)).toEqual(['schedule', 'move', 'priority', 'labels', 'duplicate', 'copy-link', 'delete'])
  })

  it('delete is destructive', () => {
    const a = contextActions()
    expect(a.find((x) => x.id === 'delete')?.destructive).toBe(true)
  })

  it('the others are not destructive', () => {
    for (const x of contextActions().filter((x) => x.id !== 'delete')) {
      expect(x.destructive).toBe(false)
    }
  })
})

describe('bulkActions', () => {
  it('offers the bulk toolbar of design D3', () => {
    const a = contextActions('bulk')
    expect(a.map((x) => x.id)).toEqual(['complete', 'schedule', 'move', 'delete'])
  })
})