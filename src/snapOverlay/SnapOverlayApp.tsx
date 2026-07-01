import type { CSSProperties } from 'react'
import type { Placement } from '@shared/types'
import { accentHex } from '@shared/accent'
import { useEffect, useState } from 'react'
import './snapOverlay.css'

/**
 * Snap-zone ghost shown during a drag (MO-8, MO-35).
 *
 * The overlay BrowserWindow is sized to island footprint + OVERLAY_PADDING_X on each
 * side and OVERLAY_PADDING_Y below (no top offset — the window starts at snap.y = 0,
 * flush with the screen top). The ghost's top edge aligns with the screen top so the
 * island appears to emerge from the notch / menu bar when it snaps.
 *
 * Visual states:
 *   dragging (far)  → faint dashed accent outline + "DROP TO SNAP" label
 *   nearSnap        → bright glowing solid outline + outer bloom ring + "RELEASE" label
 *
 * Animations: fade-in + scaleY on drag start; glow pulse while nearSnap.
 * See snapOverlay.css. This is a scoped exception to the global animation-deferral
 * policy — see .scratch/animation-tuning/issues/01-tune-all-animations.md.
 */
export function SnapOverlayApp() {
  const [placement, setPlacement] = useState<Placement>({
    snapped: false,
    dragging: false,
    nearSnap: false,
    hasNotch: false,
    notchHeight: 0,
    notchWidth: 0,
    notchCenterX: 0,
  })
  const [accent, setAccent] = useState<string>('#8FC8C0')

  useEffect(() => {
    void window.api.island.getPlacement().then(setPlacement)
    const offPlacement = window.api.island.onPlacement(setPlacement)

    void window.api.prefs.get().then((p) => setAccent(accentHex(p.accent)))
    const offPrefs = window.api.prefs.onChange((p) => setAccent(accentHex(p.accent)))

    return () => {
      offPlacement()
      offPrefs()
    }
  }, [])

  if (!placement.dragging) return null

  return (
    <div
      className="snap-overlay-root"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        // Sides inset less than OVERLAY_PADDING_X so the ghost is wider than the
        // dock; the difference (~ per side) stays as blur room. No top padding —
        // ghost is flush with the screen top edge (y=0). Height gives blur room below.
        padding: '0 50px 0',
        pointerEvents: 'none',
      }}
    >
      <NotchGhost nearSnap={placement.nearSnap} accent={accent} />
    </div>
  )
}

// Dark ink used for the line + text by default; switches to the theme accent on
// near-snap ("hovering" the drop zone).
const DROP_DARK = 'rgba(24,26,31,0.92)'
// Drop-zone bar height — shorter + wider than the dock so it reads as a target.
const DROP_H = 34

function NotchGhost({ nearSnap, accent }: { nearSnap: boolean; accent: string }) {
  const h = accent.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`

  const ink = nearSnap ? accent : DROP_DARK

  // Flat top (flush with the screen edge), rounded bottom — mirrors the dock.
  const shape: CSSProperties = {
    flex: '1 1 auto',
    height: DROP_H,
    borderRadius: '0 0 16px 16px',
    borderTop: 'none',
    position: 'relative',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const labelStyle: CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12.5,
    letterSpacing: '0.08em',
    fontWeight: 700,
    color: ink,
    // Light halo keeps the dark text legible over any wallpaper.
    textShadow: nearSnap ? 'none' : '0 1px 2px rgba(255,255,255,0.5)',
    userSelect: 'none',
  }

  if (nearSnap) {
    return (
      <div
        className="snap-ghost-near"
        style={{
          ...shape,
          border: `3px solid ${accent}`,
          borderTop: 'none',
          boxShadow: [`0 0 12px 3px ${rgba(0.5)}`, `0 0 26px 9px ${rgba(0.26)}`, `inset 0 0 9px 2px ${rgba(0.12)}`].join(','),
        }}
      >
        {/* Outer bloom ring — wider gap from the border so they don't crowd */}
        <div
          style={{
            position: 'absolute',
            inset: -16,
            top: 0,
            borderRadius: '0 0 30px 30px',
            border: `1px solid ${rgba(0.38)}`,
            borderTop: 'none',
            boxShadow: `0 0 30px 10px ${rgba(0.16)}`,
            pointerEvents: 'none',
          }}
        />
        <span style={labelStyle}>RELEASE</span>
      </div>
    )
  }

  return (
    <div className="snap-ghost-far" style={{ ...shape, border: `3px dashed ${DROP_DARK}`, borderTop: 'none' }}>
      <span style={labelStyle}>DROP TO SNAP</span>
    </div>
  )
}
