// The app's navigation (OpenSpec change rn-taskito-foundation, design D1): four
// tabs, each with its own stack, and the Inbox tab's count.

/** A tab of the app's tab bar. */
export interface Tab {
  name: 'Today' | 'Inbox' | 'Upcoming' | 'Browse'
  /** The route the tab's stack starts at. */
  route: string
  /** Whether the tab shows a count badge (the Inbox). */
  badge: boolean
}

/** The Inbox tab's name. */
export const INBOX_TAB = 'Inbox' as const

/** The four destinations of design D1, in order. */
export const TABS: readonly Tab[] = [
  { name: 'Today', route: 'today', badge: false },
  { name: 'Inbox', route: 'inbox', badge: true },
  { name: 'Upcoming', route: 'upcoming', badge: false },
  { name: 'Browse', route: 'browse', badge: false },
]