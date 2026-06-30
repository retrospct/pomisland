// Notch geometry provider — single source of truth for where the camera notch
// sits on a given display. Electron's `screen` API exposes the menu-bar band
// (workArea.y - bounds.y) but NOT the notch's width or horizontal extent, so we
// estimate it here behind a swappable interface.
//
// `EstimateNotchProvider` is the default, dependency-free implementation. A
// `SwiftHelperNotchProvider` (reading NSScreen.auxiliaryTopLeftArea / Right via a
// bundled helper, like SuperIsland's ScreenDetector) can be dropped in later for
// pixel-exact width — see the plan, phase 2. Both conform to `NotchProvider`, so
// the rest of the app never learns which one is in use.

import type { Display } from 'electron'

export interface NotchMetrics {
  /** True when the display has a hardware notch (built-in display + menu-bar band ≥ NOTCH_MIN_HEIGHT). */
  hasNotch: boolean
  /** Absolute screen Y of the notch top edge (= display.bounds.y). */
  notchTop: number
  /** Height (px) of the notch band: workArea.y - bounds.y. 0 on non-notch displays. */
  notchHeight: number
  /** Notch width in logical points. 0 when hasNotch === false. */
  notchWidth: number
  /** Absolute screen X of the notch center (Apple notches are display-centered). */
  notchCenterX: number
}

export interface NotchProvider {
  get(display: Display): NotchMetrics
}

/**
 * Menu-bar height threshold distinguishing a notched built-in display (~32–39px)
 * from a non-notched built-in display (~24px). Only applied to internal displays —
 * external monitors can have a ≥30px menu bar at hi-res scaling (e.g. a 4K panel
 * reports 30px), so height alone is not a reliable notch signal. See `hasNotch`.
 */
const NOTCH_MIN_HEIGHT = 30

/**
 * Notch width as a fraction of the display's logical width. The physical notch is
 * a fixed size, so its logical width scales linearly with the logical resolution
 * (`bounds.width`): notchLogical = physicalNotch × logicalWidth / physicalWidth,
 * and physicalNotch/physicalWidth is the per-model constant below. 0.132 yields
 * ~200pt on a 1512-wide 14"/16" MacBook Pro at default scaling and tracks the
 * user's "More Space / Larger Text" choice automatically. Calibrate against the
 * Swift helper (phase 2) if it drifts on a specific model.
 */
const NOTCH_WIDTH_FRACTION = 0.132
/** Clamp so an odd display never produces an absurd spacer. */
const NOTCH_WIDTH_MIN = 150
const NOTCH_WIDTH_MAX = 250

/**
 * Maximum physical notch height we'll report to the renderer. Current MacBook
 * Pro / Air notches are ≤38px. Capping prevents inflated workArea.y (Stage
 * Manager, custom menu-bar tools) from producing an oversized spacer.
 */
const NOTCH_HEIGHT_MAX = 40

/** Default estimate-based provider — no native code, scaling-aware. */
export class EstimateNotchProvider implements NotchProvider {
  get(display: Display): NotchMetrics {
    const notchTop = display.bounds.y
    const rawHeight = display.workArea.y - display.bounds.y
    // A notch only exists on the built-in display, so gate on `internal`. A tall
    // menu bar on a hi-res external (4K reports 30px) must NOT count as a notch.
    const hasNotch = display.internal && rawHeight >= NOTCH_MIN_HEIGHT
    // Clamp so an inflated workArea.y (Stage Manager etc.) doesn't bloat the spacer.
    const notchHeight = hasNotch ? Math.min(rawHeight, NOTCH_HEIGHT_MAX) : rawHeight
    const notchCenterX = display.bounds.x + display.bounds.width / 2
    const notchWidth = hasNotch
      ? Math.round(
          Math.min(
            NOTCH_WIDTH_MAX,
            Math.max(NOTCH_WIDTH_MIN, display.bounds.width * NOTCH_WIDTH_FRACTION),
          ),
        )
      : 0
    return { hasNotch, notchTop, notchHeight, notchWidth, notchCenterX }
  }
}

let provider: NotchProvider = new EstimateNotchProvider()

/** Swap the active provider (phase 2 wiring point for the Swift helper). */
export function setNotchProvider(p: NotchProvider): void {
  provider = p
}

/** Resolve notch geometry for a display via the active provider. */
export function getNotchMetrics(display: Display): NotchMetrics {
  return provider.get(display)
}
