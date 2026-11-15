// The offline status line and the sync state (OpenSpec change
// rn-taskito-foundation, task 3.6): the line a list shows when the device is
// offline or syncing. The rule is pure; the screen's subscription is its own.
import { statusLine } from '../src/syncStatus'

describe('statusLine', () => {
  it('says offline when the device is offline', () => {
    expect(statusLine({ state: 'offline', pending: 0 })).toBe('Offline')
  })

  it('says syncing while an exchange runs', () => {
    expect(statusLine({ state: 'syncing', pending: 0 })).toBe('Syncing…')
  })

  it('says how many changes wait', () => {
    expect(statusLine({ state: 'idle', pending: 3 })).toBe('3 changes waiting')
  })

  it('says one change waits (singular)', () => {
    expect(statusLine({ state: 'idle', pending: 1 })).toBe('1 change waiting')
  })

  it('is empty when nothing is happening', () => {
    expect(statusLine({ state: 'idle', pending: 0 })).toBe('')
  })

  it('offline wins over syncing', () => {
    expect(statusLine({ state: 'offline', pending: 2 })).toBe('Offline')
  })
})