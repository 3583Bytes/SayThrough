import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { LAYOUT } from '../../constants/layout'
import type { Button } from '../../types/models'
import { DraggableCell } from '../edit/DraggableCell'
import { SymbolButton } from './SymbolButton'

const SEAM = 14 // gap between the core zone and the topic zone

interface SymbolGridProps {
  rows: number
  columns: number
  buttons: Button[]
  // §19.2 persistent core region: the N leftmost columns are the
  // always-here core words. >0 draws a framed core panel + seam so the
  // two zones read as distinct; 0 = plain uniform grid (Quick Phrases,
  // user pages).
  coreColumns?: number
  isEditMode?: boolean
  selectedButtonId?: string | null
  flashButtonId?: string | null
  gap?: number // profile buttonGap preference (§6.1) — wide reduces mis-hits
  scanHighlightIds?: Set<string> // §AM-05: buttons the scan cursor is on
  // §4.8: 'filtering' dims buttons NOT in ids; 'editing' badges those in ids
  filterState?: { mode: 'filtering' | 'editing'; ids: Set<string> }
  onButtonPress: (button: Button) => void
  onButtonLongPress?: (button: Button) => void
  onButtonMove?: (button: Button, toRow: number, toColumn: number) => void
  onEmptyCellPress?: (row: number, column: number) => void // edit mode only
}

export function SymbolGrid({
  rows,
  columns,
  buttons,
  coreColumns = 0,
  isEditMode,
  selectedButtonId,
  flashButtonId,
  gap = LAYOUT.gridGap,
  scanHighlightIds,
  filterState,
  onButtonPress,
  onButtonLongPress,
  onButtonMove,
  onEmptyCellPress,
}: SymbolGridProps) {
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 })

  const split = coreColumns > 0 && coreColumns < columns
  const seamW = split ? SEAM : 0
  const cellWidth =
    (gridSize.width - LAYOUT.gridPadding * 2 - seamW - gap * (columns - 1)) / columns
  const cellHeight =
    (gridSize.height - LAYOUT.gridPadding * 2 - gap * (rows - 1)) / rows

  const byPosition = new Map(
    buttons
      .filter((b) => isEditMode || !b.isHidden)
      .map((b) => [`${b.row}:${b.column}`, b]),
  )

  const dragEnabled = !!isEditMode && !!onButtonMove && filterState?.mode !== 'editing'

  const handleDrop = (button: Button, dxCells: number, dyCells: number) => {
    const toRow = Math.max(0, Math.min(rows - 1, button.row + dyCells))
    const toColumn = Math.max(0, Math.min(columns - 1, button.column + dxCells))
    if (toRow === button.row && toColumn === button.column) return
    onButtonMove?.(button, toRow, toColumn)
  }

  const renderCell = (row: number, column: number) => {
    const button = byPosition.get(`${row}:${column}`)
    if (button) {
      const symbolButton = (
        <SymbolButton
          button={button}
          isSelected={isEditMode && button.id === selectedButtonId}
          isFlashing={button.id === flashButtonId}
          isScanHighlighted={scanHighlightIds?.has(button.id)}
          dimmed={filterState?.mode === 'filtering' && !filterState.ids.has(button.id)}
          showCheck={filterState?.mode === 'editing' && filterState.ids.has(button.id)}
          accommodate={!isEditMode}
          onPress={onButtonPress}
          onLongPress={onButtonLongPress}
        />
      )
      return dragEnabled ? (
        <DraggableCell
          key={button.id}
          enabled
          cellWidth={cellWidth}
          cellHeight={cellHeight}
          gap={gap}
          onDrop={(dx, dy) => handleDrop(button, dx, dy)}
        >
          {symbolButton}
        </DraggableCell>
      ) : (
        <View key={button.id} style={styles.cell}>
          {symbolButton}
        </View>
      )
    }
    if (isEditMode && onEmptyCellPress) {
      // §5.6: dashed outline on empty cells — tap to add a button
      return (
        <Pressable
          key={`empty-${row}-${column}`}
          accessibilityRole="button"
          accessibilityLabel={`Add button at row ${row + 1}, column ${column + 1}`}
          onPress={() => onEmptyCellPress(row, column)}
          style={({ pressed }) => [styles.emptyCellEditable, pressed && styles.pressed]}
        />
      )
    }
    return <View key={`empty-${row}-${column}`} style={styles.emptyCell} />
  }

  const renderRows = (colStart: number, colEnd: number) =>
    Array.from({ length: rows }, (_, row) => (
      <View key={row} style={[styles.row, { gap }]}>
        {Array.from({ length: colEnd - colStart }, (_, i) => renderCell(row, colStart + i))}
      </View>
    ))

  if (split) {
    return (
      <View
        style={[styles.gridOuter, { gap }]}
        onLayout={(e) => setGridSize(e.nativeEvent.layout)}
      >
        {/* Persistent core region — same framed panel on every page in the
            set, so the "these words are always here" idea is visible (§19.2) */}
        <View style={[styles.coreFrame, { flex: coreColumns, gap }]}>
          {renderRows(0, coreColumns)}
        </View>
        <View style={{ width: SEAM }} />
        {/* Topic zone — transparent border/padding matches the core panel's
            insets so rows stay aligned across the seam */}
        <View style={[styles.topicZone, { flex: columns - coreColumns, gap }]}>
          {renderRows(coreColumns, columns)}
        </View>
      </View>
    )
  }

  return (
    <View
      style={[styles.grid, { gap }]}
      onLayout={(e) => setGridSize(e.nativeEvent.layout)}
    >
      {renderRows(0, columns)}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flex: 1,
    padding: LAYOUT.gridPadding,
  },
  gridOuter: {
    flex: 1,
    flexDirection: 'row',
    padding: LAYOUT.gridPadding,
  },
  coreFrame: {
    backgroundColor: '#EEF3F7',
    borderColor: '#D3DEE7',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 5,
  },
  topicZone: {
    borderColor: 'transparent',
    borderWidth: 1.5,
    padding: 5,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
  },
  emptyCell: {
    flex: 1,
  },
  emptyCellEditable: {
    flex: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BBBBBB',
    borderRadius: LAYOUT.buttonRadius,
  },
  pressed: {
    opacity: 0.6,
    backgroundColor: '#F0F0F0',
  },
})
