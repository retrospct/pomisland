import { useCallback, useRef } from 'react'

/**
 * Seam for the custom JS→IPC drag loop (MO-9, ADR-0003).
 * Owns mousedown→IPC binding and interactive-element exclusion so that
 * swapping to native app-region later is a one-file change.
 *
 * Excluded targets: <button> elements and anything with [data-drag-exclude]
 * (the latter is reserved for the task-text hotspot added by MO-6).
 */
export function useDrag() {
  const moved = useRef(false)
  const justDragged = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('[data-drag-exclude]')) return

    moved.current = false
    window.api.island.dragStart(e.screenX, e.screenY)

    const onMove = (ev: MouseEvent) => {
      moved.current = true
      window.api.island.dragMove(ev.screenX, ev.screenY)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.api.island.dragEnd()
      if (moved.current) {
        justDragged.current = true
        setTimeout(() => (justDragged.current = false), 60)
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  return { onMouseDown, justDragged }
}
