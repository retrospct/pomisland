import type { CSSProperties } from 'react'
import type { Placement } from '@shared/types'
import { useEffect, useState } from 'react'

/**
 * Snap-zone ghost shown during a drag (MO-8).
 *
 * The overlay BrowserWindow is sized to the island footprint + PADDING_X/Y on each
 * side (see windows.ts). We fill the ghost to cover `100vw - 2*PADDING` so it
 * automatically adapts when the window is resized for different island widths.
 *
 * Visual states:
 *   dragging  → faint static dashed outline in the notch shape
 *   nearSnap  → bright glowing solid outline + outer bloom ring
 *
 * Animation feel is an intentional later-pass (MO-21); we land the states here.
 */
export function SnapOverlayApp() {
  const [placement, setPlacement] = useState<Placement>({
    snapped: false,
    dragging: false,
    nearSnap: false,
  })

  useEffect(() => {
    void window.api.island.getPlacement().then(setPlacement)
    const off = window.api.island.onPlacement(setPlacement)
    return off
  }, [])

  if (!placement.dragging) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        // The outer padding matches OVERLAY_PADDING in windows.ts.
        padding: '20px 40px',
        pointerEvents: 'none',
      }}
    >
      <NotchGhost nearSnap={placement.nearSnap} />
    </div>
  )
}

function NotchGhost({ nearSnap }: { nearSnap: boolean }) {
  // Notch pill shape: square top edge (flush with menubar), rounded bottom corners.
  const shape: CSSProperties = {
    flex: '1 1 auto',
    height: '100%',
    borderRadius: '0 0 20px 20px',
    position: 'relative',
    pointerEvents: 'none',
  }

  if (nearSnap) {
    return (
      <div
        style={{
          ...shape,
          border: '1.5px solid rgba(110,215,255,0.9)',
          boxShadow: [
            '0 0 10px 3px rgba(90,200,255,0.5)',
            '0 0 24px 8px rgba(60,175,255,0.28)',
            'inset 0 0 8px 2px rgba(90,200,255,0.1)',
          ].join(','),
        }}
      >
        {/* Larger outer bloom ring */}
        <div
          style={{
            position: 'absolute',
            inset: -7,
            borderRadius: '0 0 27px 27px',
            border: '1px solid rgba(80,185,255,0.4)',
            boxShadow: '0 0 30px 10px rgba(55,165,255,0.18)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        ...shape,
        border: '1.5px dashed rgba(255,255,255,0.25)',
      }}
    />
  )
}
