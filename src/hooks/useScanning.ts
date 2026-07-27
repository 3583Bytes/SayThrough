import { useCallback, useEffect, useRef, useState } from 'react'
import { ttsService } from '../services/TTSService'

// §AM-05 switch scanning engine. Drives a moving highlight over an
// ordered set of groups→items and selects on a switch signal. Switch
// input is keyboard (Space = select, Enter = advance in step mode) —
// Bluetooth AAC switches emulate these — and, so a screen-tap switch
// works too, callers route grid taps to select().
//
// Patterns: row-column (scan groups/rows, then items within a row) and
// linear (scan every item one at a time). Modes: auto (1 switch, timed)
// and step (2 switches, no timer).

export interface ScanItem {
  id: string
  label: string
  activate: () => void
}

interface Options {
  enabled: boolean
  groups: ScanItem[][] // ordered; row-column treats each group as a row
  resetKey: string // change → restart scanning (e.g., current page id)
  mode: 'auto' | 'step'
  pattern: 'row-column' | 'linear'
  speed: number // ms between auto advances
  auditory: boolean
}

interface Position {
  level: 'group' | 'item'
  gi: number
  ii: number
}

export function useScanning(opts: Options): {
  highlightedIds: Set<string>
  select: () => void
} {
  const { enabled, groups, resetKey, mode, pattern, speed, auditory } = opts
  const [pos, setPos] = useState<Position>({ level: 'group', gi: 0, ii: 0 })

  // latest values for the interval/keyboard closures
  const ref = useRef({ groups, pattern, mode, auditory })
  ref.current = { groups, pattern, mode, auditory }

  const nonEmpty = groups.length > 0 && groups.some((g) => g.length > 0)

  // Restart when the board changes or scanning turns on
  useEffect(() => {
    setPos({ level: pattern === 'linear' ? 'item' : 'group', gi: 0, ii: 0 })
  }, [resetKey, pattern, enabled])

  const advance = useCallback(() => {
    setPos((p) => {
      const g = ref.current.groups
      if (g.length === 0) return p
      if (ref.current.pattern === 'linear') {
        // treat as a flat list: walk items across all groups
        const flat: Array<[number, number]> = []
        g.forEach((grp, gi) => grp.forEach((_, ii) => flat.push([gi, ii])))
        if (flat.length === 0) return p
        const cur = flat.findIndex(([gi, ii]) => gi === p.gi && ii === p.ii)
        const [gi, ii] = flat[(cur + 1) % flat.length]
        return { level: 'item', gi, ii }
      }
      // row-column
      if (p.level === 'group') {
        return { level: 'group', gi: (p.gi + 1) % g.length, ii: 0 }
      }
      const row = g[p.gi] ?? []
      if (p.ii + 1 >= row.length) {
        // scanned the whole row → escape back to group scanning
        return { level: 'group', gi: (p.gi + 1) % g.length, ii: 0 }
      }
      return { level: 'item', gi: p.gi, ii: p.ii + 1 }
    })
  }, [])

  const select = useCallback(() => {
    setPos((p) => {
      const g = ref.current.groups
      if (g.length === 0) return p
      if (ref.current.pattern === 'linear') {
        g[p.gi]?.[p.ii]?.activate()
        return { level: 'item', gi: 0, ii: 0 }
      }
      if (p.level === 'group') {
        const row = g[p.gi] ?? []
        if (row.length === 1) {
          row[0].activate()
          return { level: 'group', gi: 0, ii: 0 }
        }
        return { level: 'item', gi: p.gi, ii: 0 } // drill into the row
      }
      g[p.gi]?.[p.ii]?.activate()
      return { level: 'group', gi: 0, ii: 0 } // restart after selecting
    })
  }, [])

  // Auto-scan timer
  useEffect(() => {
    if (!enabled || !nonEmpty || mode !== 'auto') return
    const id = setInterval(advance, Math.max(300, speed))
    return () => clearInterval(id)
  }, [enabled, nonEmpty, mode, speed, advance])

  // Switch input via keyboard (real switches emulate these keys)
  useEffect(() => {
    if (!enabled || !nonEmpty) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        select()
      } else if (e.code === 'Enter' && ref.current.mode === 'step') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, nonEmpty, select, advance])

  // Compute the highlighted id set for the current position
  const highlightedIds = new Set<string>()
  if (enabled && nonEmpty) {
    if (pattern === 'linear' || pos.level === 'item') {
      const item = groups[pos.gi]?.[pos.ii]
      if (item) highlightedIds.add(item.id)
    } else {
      for (const item of groups[pos.gi] ?? []) highlightedIds.add(item.id)
    }
  }

  // Auditory cue when the highlight changes
  const spokenRef = useRef('')
  useEffect(() => {
    if (!enabled || !auditory) return
    const item =
      pattern === 'linear' || pos.level === 'item'
        ? groups[pos.gi]?.[pos.ii]
        : groups[pos.gi]?.[0]
    const label = item?.label ?? ''
    if (label && label !== spokenRef.current) {
      spokenRef.current = label
      ttsService.speak(label)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, enabled, auditory])

  return { highlightedIds, select }
}
