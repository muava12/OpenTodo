// The thread and the section headers (OpenSpec change rn-taskito-foundation,
// task 3.2): the thread joins the rows of one section, and a section header
// breaks it. The rule is the row group's, pure so it is tested without a screen.
import { groups, type Group } from '../src/sections'

describe('groups', () => {
  it('breaks the thread at a section header', () => {
    const g = groups([
      { kind: 'header', title: 'Overdue' },
      { kind: 'row', id: 'a' },
      { kind: 'row', id: 'b' },
      { kind: 'header', title: 'Today' },
      { kind: 'row', id: 'c' },
    ])
    expect(g.map((x) => x.thread)).toEqual([false, false, true, false, false])
  })

  it('starts the thread again after a header', () => {
    const g = groups([
      { kind: 'header', title: 'Overdue' },
      { kind: 'row', id: 'a' },
      { kind: 'header', title: 'Today' },
      { kind: 'row', id: 'b' },
      { kind: 'row', id: 'c' },
    ])
    expect(g.map((x) => x.thread)).toEqual([false, false, false, false, true])
  })

  it('has no thread on a header row', () => {
    const g = groups([{ kind: 'header', title: 'Today' }, { kind: 'row', id: 'a' }])
    expect(g[0].thread).toBe(false)
  })

  it('keeps every item in order', () => {
    const g = groups([
      { kind: 'header', title: 'A' },
      { kind: 'row', id: 'x' },
      { kind: 'header', title: 'B' },
      { kind: 'row', id: 'y' },
    ])
    expect(g.map((x) => (x.kind === 'row' ? x.id : x.title))).toEqual(['A', 'x', 'B', 'y'])
  })
})

describe('a section header', () => {
  it('has no thread', () => {
    const h: Group = { kind: 'header', title: 'Today', thread: false }
    expect(h.thread).toBe(false)
  })

  it('a row knows its section', () => {
    const g = groups([{ kind: 'header', title: 'Overdue' }, { kind: 'row', id: 'a' }])
    expect(g[1].kind === 'row' ? g[1].section : '').toBe('Overdue')
  })
})