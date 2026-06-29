// Accent resolution, ported and generalized from Island.dc.html renderVals.
// Focus uses the user's chosen accent; break uses a warm clay; the final
// minute of a running focus block shifts to urgent amber (see ADR / CONTEXT.md).
//
// The accent swatches are pastels tuned for the dark island surface. On light
// surfaces they wash out, so both windows darken the accent for legibility via
// the shared `resolveAccentColor` below — keep that single source of truth so
// the island and Settings can never drift (MO-29).

import type { AccentKey, Mode, Status } from './types'

/** Accent swatch keys → base hex. Mirrors the ACC map in SettingsPanel.dc.html. */
export const ACCENT_HEX: Record<AccentKey, string> = {
  teal: '#8FC8C0',
  clay: '#E2A24A',
  blue: '#6F9CEB',
  violet: '#A88BE0',
  rose: '#E08AA6',
  green: '#84B26A',
}

export function accentHex(key: AccentKey): string {
  return ACCENT_HEX[key] ?? ACCENT_HEX.teal
}

const BREAK = '#e2a24a'
const URGENT = '#ecb24e'
const BREAK_BRIGHT = '#f4d7a4'
const URGENT_BRIGHT = '#f7dfa8'

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Mix a hex color toward white by `amount` in [0,1]. */
export function lighten(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex)
  const mix = (c: number) => clampByte(c + (255 - c) * amount)
  const toHex = (c: number) => mix(c).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Mix a hex color toward black by `amount` in [0,1]. */
export function darken(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex)
  const mix = (c: number) => clampByte(c * (1 - amount))
  const toHex = (c: number) => mix(c).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Relative luminance in [0,1]. */
export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/** RGB (0–255) → HSL, all components in [0,1]. */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h / 6, s, l]
}

/** HSL (all in [0,1]) → hex. */
function hslToHex(h: number, s: number, l: number): string {
  let r: number
  let g: number
  let b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  const toHex = (c: number) => clampByte(c * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export interface AccentSet {
  accent: string
  accentBright: string
  accentSoft: string
}

// Light-mode accent tuning (MO-29). The swatches are pale pastels tuned for the
// dark island; on the light surface they wash out. We deepen them in HSL rather
// than mixing toward black: a plain darken desaturates into muddy gray-greens,
// whereas boosting saturation + moderately lowering lightness keeps each accent
// recognizably itself — a richer version of the dark-mode color, not a sludge.
// Tune these two knobs to taste: lower L = more legible/darker, higher S = more
// vivid.
const LIGHT_ACCENT_L = 0.4
const LIGHT_ACCENT_S_GAIN = 1.45

/**
 * Adapt a pastel accent hex to the surface theme. Dark mode shows the pastel as-is;
 * light mode deepens it (see notes above). Shared by `resolveAccent` (island) and
 * `paletteVars` (Settings) so the two windows resolve the accent identically.
 */
export function resolveAccentColor(base: string, theme: 'light' | 'dark'): string {
  if (theme === 'dark') return base
  const [r, g, b] = parseHex(base)
  const [h, s] = rgbToHsl(r, g, b)
  return hslToHex(h, Math.min(1, s * LIGHT_ACCENT_S_GAIN), LIGHT_ACCENT_L)
}

export function resolveAccent(args: {
  base: string
  mode: Mode
  status: Status
  remaining: number
  theme?: 'light' | 'dark'
}): AccentSet {
  const { base, mode, status, remaining, theme = 'dark' } = args
  const isBreak = mode === 'break'
  const isFocus = mode === 'focus'
  const isRunning = status === 'running'
  const isLight = theme === 'light'

  // Pick the semantic source hex, then adapt it to the surface theme.
  let rawAccent = isBreak ? BREAK : base
  if (isFocus && isRunning && remaining <= 60) rawAccent = URGENT
  const accent = resolveAccentColor(rawAccent, theme)

  // `accentBright` is the ring glint/glow. On dark it pushes toward white so the
  // pastel pops; on light that vanishes against the pale surface, so instead lift
  // the darkened accent slightly into a mid-tone — the gradient runs deep→mid.
  let accentBright: string
  if (isLight) accentBright = lighten(accent, 0.3)
  else if (rawAccent === URGENT) accentBright = URGENT_BRIGHT
  else if (isBreak) accentBright = BREAK_BRIGHT
  else accentBright = lighten(base, 0.4)

  return { accent, accentBright, accentSoft: hexToRgba(accent, 0.4) }
}
