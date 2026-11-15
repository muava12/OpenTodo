// The completion tap (OpenSpec change rn-taskito-foundation, task 1.3): the
// shared preference decides, the platform taps.
import { hapticsPrefOn } from '@shared/haptics'
import * as Haptics from 'expo-haptics'
import { tapComplete } from '../src/haptics'

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success' },
}))

const tapped = () => (Haptics.notificationAsync as jest.Mock).mock.calls.length

beforeEach(() => (Haptics.notificationAsync as jest.Mock).mockClear())

describe('tapComplete', () => {
  it('taps when the preference is on (the default)', async () => {
    await tapComplete({ haptics: 'on' })
    expect(tapped()).toBe(1)
  })

  it('does not tap when the preference is off', async () => {
    await tapComplete({ haptics: 'off' })
    expect(tapped()).toBe(0)
  })

  it('taps when the preference is unset (the default is on)', async () => {
    await tapComplete(null)
    expect(tapped()).toBe(1)
  })

  it('stays silent when the motor refuses', async () => {
    ;(Haptics.notificationAsync as jest.Mock).mockRejectedValueOnce(new Error('no motor'))
    await expect(tapComplete({ haptics: 'on' })).resolves.toBeUndefined()
    expect(tapped()).toBe(1)
  })
})

// The preference helper is the shared one; these cases pin that the app reads it.
describe('hapticsPrefOn (the shared preference)', () => {
  it.each([
    [{ haptics: 'on' }, true],
    [{ haptics: 'off' }, false],
    [null, true],
    [undefined, true],
    [{}, true],
  ])('%j → %s', (row, want) => expect(hapticsPrefOn(row as never)).toBe(want))
})