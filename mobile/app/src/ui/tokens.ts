// The app's visual language (OpenSpec change rn-taskito-foundation, design D6):
// the Taskito palette as tokens, and the WCAG AA contrast rule every pair must
// meet. A pair that fails is a finding, not a preference.

/** A colour as #rrggbb. */
export type Hex = `#${string}`

/** The palette of one side (light or dark). */
export interface Palette {
  accent: Hex
  background: Hex
  surface: Hex
  text: Hex
  textSecondary: Hex
  line: Hex
  high: Hex
  medium: Hex
  low: Hex
  /** The glass pill of the bottom bar, resting. */
  glass: string
  /** The glass pill of the bottom bar, focused. */
  glassFocus: string
  /** The resting pill border. */
  glassEdge: string
  /** The focused pill border. */
  glassEdgeFocus: string
  /** The inverse (FAB) button fill. */
  fabFill: Hex
  /** The icon on the inverse (FAB) button. */
  fabIcon: Hex
}

/** The type scale (design D6): the screen title, a row's title, a secondary line, a badge. */
export interface Scale {
  title: number
  row: number
  secondary: number
  badge: number
}

export const palette: { light: Palette; dark: Palette } = {
  light: {
    accent: '#3c8dff',
    background: '#ffffff',
    surface: '#f4f4f9',
    text: '#343434',
    textSecondary: '#686e78',
    line: '#eaeaf0',
    high: '#e53935',
    medium: '#b35c00',
    low: '#1e88e5',
    glass: 'rgba(255,255,255,0.92)',
    glassFocus: 'rgba(244,244,249,0.96)',
    glassEdge: 'rgba(0,0,0,0.06)',
    glassEdgeFocus: 'rgba(0,0,0,0.22)',
    fabFill: '#343434',
    fabIcon: '#ffffff',
  },
  dark: {
    accent: '#3c8dff',
    background: '#14161a',
    surface: '#1c1f24',
    text: '#eaeaf0',
    textSecondary: '#9aa0aa',
    line: '#2c3036',
    high: '#e53935',
    medium: '#fb8c00',
    low: '#1e88e5',
    glass: 'rgba(28,31,36,0.92)',
    glassFocus: 'rgba(38,42,50,0.96)',
    glassEdge: 'rgba(255,255,255,0.06)',
    glassEdgeFocus: 'rgba(255,255,255,0.22)',
    fabFill: '#eaeaf0',
    fabIcon: '#14161a',
  },
}

/** The WCAG 2.x contrast ratio of two colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

/** The relative luminance of a colour (WCAG 2.x). */
export function luminance(hex: string): number {
  const [r, g, b] = channels(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** The linearised sRGB channels (0–1) of a colour. */
function channels(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!m) throw new Error(`tokens: ${hex} is not #rrggbb`)
  const lin = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return [lin(parseInt(m[1], 16)), lin(parseInt(m[2], 16)), lin(parseInt(m[3], 16))]
}

/** A text-on-background pair the palette must pass; `min` is the WCAG AA bar (4.5 body, 3 large). */
export interface Pair {
  name: string
  fg: (p: Palette) => string
  bg: (p: Palette) => string
  min: number
}

/** Every pair the app draws, and the bar each must clear. */
export const PAIRS: readonly Pair[] = [
  { name: 'text on background', fg: (p) => p.text, bg: (p) => p.background, min: 4.5 },
  { name: 'text on surface', fg: (p) => p.text, bg: (p) => p.surface, min: 4.5 },
  { name: 'secondary on light background', fg: (p) => p.textSecondary, bg: (p) => p.background, min: 4.5 },
  { name: 'secondary on light surface', fg: (p) => p.textSecondary, bg: (p) => p.surface, min: 4.5 },
  { name: 'high on background', fg: (p) => p.high, bg: (p) => p.background, min: 3 },
  { name: 'medium on background', fg: (p) => p.medium, bg: (p) => p.background, min: 3 },
  { name: 'low on background', fg: (p) => p.low, bg: (p) => p.background, min: 3 },
]