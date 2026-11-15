// The reorder rule of a manual list (OpenSpec change rn-taskito-foundation,
// task 3.5): a dragged row takes a position between its new neighbours, as the
// web's ordering rank does. The rule is pure; the write is ops'.
import { reorder, type Ordered } from '../src/reorder'

const rows: Ordered[] = [
  { id: 'a', position: 100 },
  { id: 'b', position: 200 },
  { id: 'c', position: 300 },
]

describe('reorder', () => {
  it('moves a row between two neighbours', () => {
    const p = reorder(rows, 'c', 'b')
    expect(p.get('c')).toBe(150)
  })

  it('moves a row to the end', () => {
    const p = reorder(rows, 'a', null)
    expect(p.get('a')).toBe(1300)
  })

  it('moves a row to the top', () => {
    const p = reorder(rows, 'b', 'a')
    expect(p.get('b')).toBe(-900)
  })

  it('leaves the other rows alone', () => {
    const p = reorder(rows, 'c', 'a')
    expect(p.size).toBe(1)
  })

  it('does nothing when the neighbour is missing', () => {
    expect(reorder(rows, 'c', 'zzz').size).toBe(0)
  })
})