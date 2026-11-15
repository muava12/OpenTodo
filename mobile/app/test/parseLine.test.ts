// The quick-add bar's parse (OpenSpec change rn-taskito-foundation, task 4.1):
// the shared parser over the typed line, and the chips it yields.
import { chipsOf, parseLine } from '../src/parseLine'

describe('parseLine', () => {
  it('reads a date, a time and a priority from a line', () => {
    const r = parseLine('Call Sarah next Wed 3pm #work p1', { today: '2026-11-15', projects: [] })
    expect(r.title).toBe('Call Sarah #work')
    expect(r.due?.date).toBe('2026-11-18')
    expect(r.due?.time).toBe('15:00')
    expect(r.priority).toBe(1)
  })

  it('a line with no attributes is a title only', () => {
    const r = parseLine('Buy milk', { today: '2026-11-15', projects: [] })
    expect(r.title).toBe('Buy milk')
    expect(r.due).toBeNull()
  })
})

describe('chipsOf', () => {
  it('yields a chip per recognised attribute', () => {
    const r = parseLine('Call Sarah next Wed 3pm #work p1', { today: '2026-11-15', projects: [] })
    const chips = chipsOf(r)
    expect(chips.some((c) => c.kind === 'date')).toBe(true)
    expect(chips.some((c) => c.kind === 'time')).toBe(true)
    expect(chips.some((c) => c.kind === 'priority')).toBe(true)
  })

  it('yields no chips for a plain title', () => {
    expect(chipsOf(parseLine('Buy milk', { today: '2026-11-15', projects: [] }))).toHaveLength(0)
  })
})