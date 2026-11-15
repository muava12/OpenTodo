// The app's visual language (OpenSpec change rn-taskito-foundation, design D6):
// the Taskito palette as tokens, and the WCAG AA contrast rule every pair must
// meet. A pair that fails is a finding, not a preference.
import { contrastRatio, PAIRS, palette, type Scale } from '../src/ui/tokens'

describe('palette', () => {
  it.each([
    ['light', palette.light],
    ['dark', palette.dark],
  ])('%s has the six colours of design D6', (_name, p) => {
    expect(p.accent).toMatch(/^#[0-9a-f]{6}$/i)
    expect(p.background).toMatch(/^#[0-9a-f]{6}$/i)
    expect(p.surface).toMatch(/^#[0-9a-f]{6}$/i)
    expect(p.text).toMatch(/^#[0-9a-f]{6}$/i)
    expect(p.textSecondary).toMatch(/^#[0-9a-f]{6}$/i)
    expect(p.line).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it.each([
    ['light', palette.light],
    ['dark', palette.dark],
  ])('%s has the three priority colours', (_name, p) => {
    expect(p.high).toMatch(/^#[0-9a-f]{6}$/i)
    expect(p.medium).toMatch(/^#[0-9a-f]{6}$/i)
    expect(p.low).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('matches the Taskito palette (colors.xml)', () => {
    expect(palette.light).toMatchObject({
      accent: '#3c8dff',
      background: '#ffffff',
      surface: '#f4f4f9',
      text: '#343434',
      textSecondary: '#686e78',
      line: '#eaeaf0',
      high: '#e53935',
      medium: '#b35c00',
      low: '#1e88e5',
    })
    expect(palette.dark).toMatchObject({
      accent: '#3c8dff',
      background: '#14161a',
      surface: '#1c1f24',
      text: '#eaeaf0',
      textSecondary: '#9aa0aa',
      line: '#2c3036',
    })
  })
})

describe('contrast (WCAG AA)', () => {
  it('passes every text pair on both sides', () => {
    for (const [name, p] of Object.entries(palette)) {
      for (const pair of PAIRS) {
        const ratio = contrastRatio(pair.fg(p), pair.bg(p))
        // The failure message names the pair and the side, so a failing build says where.
        if (ratio < pair.min) throw new Error(`${name}: ${pair.name} is ${ratio.toFixed(2)}:1, needs ${pair.min}:1`)
      }
    }
  })

  it('passes the accent on the background (a button, a link)', () => {
    for (const p of [palette.light, palette.dark]) {
      expect(contrastRatio(p.accent, p.background)).toBeGreaterThanOrEqual(3)
    }
  })

  it('passes text on the accent (a filled button)', () => {
    for (const p of [palette.light, palette.dark]) {
      expect(contrastRatio('#ffffff', p.accent)).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('scale', () => {
  const scale: Scale = { title: 22, row: 16, secondary: 13, badge: 11 }

  it('has the four sizes of design D6', () => {
    expect(scale.title).toBe(22)
    expect(scale.row).toBe(16)
    expect(scale.secondary).toBe(13)
    expect(scale.badge).toBe(11)
  })
})