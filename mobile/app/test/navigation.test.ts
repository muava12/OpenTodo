// The app's navigation (OpenSpec change rn-taskito-foundation, design D1): four
// tabs, each with its own stack, and the Inbox tab's count. The tabs are the
// platform's (react-native-bottom-tabs); the routes are this file's.
import { INBOX_TAB, TABS } from '../src/navigation'

describe('TABS', () => {
  it('has the four destinations of design D1', () => {
    expect(TABS.map((t) => t.name)).toEqual(['Today', 'Inbox', 'Upcoming', 'Browse'])
  })

  it('keeps Today first and Browse last', () => {
    expect(TABS[0].name).toBe('Today')
    expect(TABS[TABS.length - 1].name).toBe('Browse')
  })

  it('names each tab with its route', () => {
    for (const t of TABS) {
      expect(t.route).toBe(t.name.toLowerCase())
    }
  })

  it('shows the Inbox count on its tab', () => {
    const inbox = TABS.find((t) => t.name === INBOX_TAB)
    expect(inbox?.badge).toBe(true)
  })

  it('shows no count on the other tabs', () => {
    for (const t of TABS.filter((t) => t.name !== INBOX_TAB)) {
      expect(t.badge).toBe(false)
    }
  })
})

describe('tabRoute', () => {
  it.each([
    ['Today', 'today'],
    ['Inbox', 'inbox'],
    ['Upcoming', 'upcoming'],
    ['Browse', 'browse'],
  ])('%s → %s', (name, route) => {
    const t = TABS.find((x) => x.name === name) as (typeof TABS)[number]
    expect(t.route).toBe(route)
  })
})