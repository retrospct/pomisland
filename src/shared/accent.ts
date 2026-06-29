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

export interface AccentSet {
  accent: string
  accentBright: string
  accentSoft: string
}

/**
 * Adapt a pastel accent hex to the surface theme. The swatches are tuned for the
 * dark island; on light they wash out, so we darken them (matching the Settings
 * primary). Shared by `resolveAccent` (island) and `paletteVars` (Settings) so the
 * two windows resolve the accent identically. See MO-29.
 */
export function resolveAccentColor(base: string, theme: 'light' | 'dark'): string {
  return theme === 'dark' ? base : darken(base, 0.55)
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
