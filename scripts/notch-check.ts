// Assertion script: proves EstimateNotchProvider derives correct notch geometry
// from Electron Display metrics — the notch-detection rule (internal display +
// menu-bar height threshold), the width-as-a-fraction-of-logical-width estimate
// (with clamping), the display-centered notch center, and the non-notch zeroing.
//
// Mirrors placement-check.ts / audio-check.ts: a synchronous, deterministic test
// that runs in Node without a test framework or Electron.
//
// Run:  npx tsx scripts/notch-check.ts

import type { Display } from 'electron'
import { EstimateNotchProvider } from '../electron/notch.ts'

let failures = 0

function eq(label: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) {
    console.log(`  PASS  ${label}`)
  } else {
    failures++
    console.error(`  FAIL  ${label}\n        expected ${e}\n        got      ${a}`)
  }
}

/** Minimal Display stub — only the fields the provider reads. */
function display(opts: {
  x?: number
  width: number
  boundsY: number
  workAreaY: number
  internal?: boolean
}): Display {
  const { x = 0, width, boundsY, workAreaY, internal = true } = opts
  return {
    internal,
    bounds: { x, y: boundsY, width, height: 982 },
    workArea: { x, y: workAreaY, width, height: 982 - (workAreaY - boundsY) },
  } as unknown as Display
}

const provider = new EstimateNotchProvider()

// --- 14"/16" MacBook Pro at default scaling: notch present, ~200pt wide, centered ---
{
  const m = provider.get(display({ x: 0, width: 1512, boundsY: 0, workAreaY: 38 }))
  eq('notched 1512: hasNotch', m.hasNotch, true)
  eq('notched 1512: notchHeight = 38', m.notchHeight, 38)
  eq('notched 1512: notchWidth ≈ 200 (1512 × 0.132)', m.notchWidth, 200)
  eq('notched 1512: center = 756', m.notchCenterX, 756)
  eq('notched 1512: notchTop = bounds.y', m.notchTop, 0)
}

// --- "More Space" scaling widens logical resolution → wider logical notch ---
{
  const m = provider.get(display({ x: 0, width: 1800, boundsY: 0, workAreaY: 38 }))
  eq('notched 1800: notchWidth tracks width (1800 × 0.132 = 238)', m.notchWidth, 238)
}

// --- very wide notched panel: width clamps to the 250 ceiling ---
{
  const m = provider.get(display({ x: 0, width: 2400, boundsY: 0, workAreaY: 38 }))
  eq('notched 2400: notchWidth clamps to 250', m.notchWidth, 250)
}

// --- external monitor (24px menu bar): no notch, width/center still reported ---
{
  const m = provider.get(display({ x: 1512, width: 2560, boundsY: 0, workAreaY: 24, internal: false }))
  eq('external: hasNotch false', m.hasNotch, false)
  eq('external: notchWidth = 0', m.notchWidth, 0)
  eq('external: notchHeight = 24', m.notchHeight, 24)
  eq('external: center = bounds.x + width/2', m.notchCenterX, 1512 + 1280)
}

// --- external 4K with a 30px menu bar: must NOT be treated as a notch ---
// (Regression: height-only heuristic false-positived this real display.)
{
  const m = provider.get(display({ x: 0, width: 3840, boundsY: 0, workAreaY: 30, internal: false }))
  eq('external 4K (30px bar): hasNotch false', m.hasNotch, false)
  eq('external 4K (30px bar): notchWidth = 0', m.notchWidth, 0)
}

// --- internal display, 30px menu bar: notch (gated on internal, not just height) ---
{
  const m = provider.get(display({ width: 1512, boundsY: 0, workAreaY: 30, internal: true }))
  eq('internal 30px: hasNotch', m.hasNotch, true)
}

// --- threshold boundary: exactly 30px counts as a notch, 29px does not ---
{
  const at30 = provider.get(display({ width: 1512, boundsY: 0, workAreaY: 30 }))
  const at29 = provider.get(display({ width: 1512, boundsY: 0, workAreaY: 29 }))
  eq('boundary: 30px → hasNotch', at30.hasNotch, true)
  eq('boundary: 29px → no notch', at29.hasNotch, false)
}

// --- non-zero bounds.x offset (second display): center accounts for offset ---
{
  const m = provider.get(display({ x: -1512, width: 1512, boundsY: 0, workAreaY: 38 }))
  eq('offset display: center = bounds.x + width/2', m.notchCenterX, -1512 + 756)
}

if (failures > 0) {
  console.error(`\n✗ ${failures} notch assertion(s) failed.`)
  process.exit(1)
}
console.log('\n✓ All notch assertions passed.')
