import { ReactNode, useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'

interface DraggableCellProps {
  enabled: boolean // edit mode only
  onDrop: (dxCells: number, dyCells: number) => void
  cellWidth: number
  cellHeight: number
  gap: number
  children: ReactNode
}

// §12.3 drag-to-move: dragging a button past a small threshold picks it
// up; dropping computes the target cell from the travel distance
// (uniform grid). Web-only mechanics via raw DOM pointer events —
// pointerdown on the cell, then move/up tracked on the DOCUMENT, the
// classic drag pattern that needs no pointer capture (capture is
// unreliable and RN-web's responder system loses stolen pans entirely).
// Covers mouse and touch; native builds get drag in Phase 2 QA.
export function DraggableCell({
  enabled,
  onDrop,
  cellWidth,
  cellHeight,
  gap,
  children,
}: DraggableCellProps) {
  const translate = useRef(new Animated.ValueXY()).current
  const [isDragging, setIsDragging] = useState(false)
  const viewRef = useRef<View>(null)

  const latest = useRef({ enabled, onDrop, cellWidth, cellHeight, gap })
  useEffect(() => {
    latest.current = { enabled, onDrop, cellWidth, cellHeight, gap }
  })

  useEffect(() => {
    // On web the View ref is the DOM element; on native these listeners
    // simply never attach
    const node = viewRef.current as unknown as HTMLElement | null
    if (!node?.addEventListener || typeof document === 'undefined') return

    let start: { x: number; y: number } | null = null
    let dragging = false

    const detachDocument = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onCancel)
    }

    const reset = () => {
      start = null
      dragging = false
      setIsDragging(false)
      translate.setValue({ x: 0, y: 0 })
      detachDocument()
    }

    const onMove = (event: PointerEvent) => {
      if (!start) return
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      if (!dragging && (Math.abs(dx) > 12 || Math.abs(dy) > 12)) {
        dragging = true
        setIsDragging(true)
      }
      if (dragging) {
        event.preventDefault()
        translate.setValue({ x: dx, y: dy })
      }
    }

    const onUp = (event: PointerEvent) => {
      if (!start) return
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      const wasDragging = dragging
      reset()
      if (!wasDragging) return
      const { cellWidth: w, cellHeight: h, gap: g, onDrop: drop } = latest.current
      if (w <= 0 || h <= 0) return
      const dxCells = Math.round(dx / (w + g))
      const dyCells = Math.round(dy / (h + g))
      if (dxCells !== 0 || dyCells !== 0) drop(dxCells, dyCells)
    }

    const onCancel = () => reset()

    const onDown = (event: PointerEvent) => {
      if (!latest.current.enabled) return
      start = { x: event.clientX, y: event.clientY }
      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
      document.addEventListener('pointercancel', onCancel)
    }

    // Symbol <img>s trigger native HTML5 image-drag, which fires
    // pointercancel and kills the pointer stream after the first move —
    // suppress it inside draggable cells
    const onNativeDragStart = (event: Event) => event.preventDefault()

    node.addEventListener('pointerdown', onDown)
    node.addEventListener('dragstart', onNativeDragStart)
    return () => {
      node.removeEventListener('pointerdown', onDown)
      node.removeEventListener('dragstart', onNativeDragStart)
      detachDocument()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Animated.View
      ref={viewRef}
      style={[
        styles.cell,
        // stop the browser turning touch drags into scrolls
        enabled && ({ touchAction: 'none' } as object),
        { transform: translate.getTranslateTransform() },
        isDragging && styles.dragging,
      ]}
    >
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
  },
  dragging: {
    zIndex: 10,
    elevation: 10,
    opacity: 0.85,
  },
})
