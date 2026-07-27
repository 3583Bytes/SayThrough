import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { LAYOUT } from '../../constants/layout'
import type { Button } from '../../types/models'
import { DraggableCell } from '../edit/DraggableCell'
import { SymbolButton } from './SymbolButton'

interface SymbolGridProps {
  rows: number
  columns: number
  buttons: Button[]
  isEditMode?: boolean
  selectedButtonId?: string | null
  flashButtonId?: string | null
  gap?: number // profile buttonGap preference (§6.1) — wide reduces mis-hits
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
  isEditMode,
  selectedButtonId,
  flashButtonId,
  gap = LAYOUT.gridGap,
  filterState,
  onButtonPress,
  onButtonLongPress,
  onButtonMove,
  onEmptyCellPress,
}: SymbolGridProps) {
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 })
  const cellWidth =
    (gridSize.width - LAYOUT.gridPadding * 2 - gap * (columns - 1)) / columns
  const cellHeight =
    (gridSize.height - LAYOUT.gridPadding * 2 - gap * (rows - 1)) / rows

  const byPosition = new Map(
    buttons
      .filter((b) => isEditMode || !b.isHidden)
      .map((b) => [`${b.row}:${b.column}`, b]),
  )

  // Drag is available in plain edit mode, not while selecting filter words
  const dragEnabled = !!isEditMode && !!onButtonMove && filterState?.mode !== 'editing'

  const handleDrop = (button: Button, dxCells: number, dyCells: number) => {
    const toRow = Math.max(0, Math.min(rows - 1, button.row + dyCells))
    const toColumn = Math.max(0, Math.min(columns - 1, button.column + dxCells))
    if (toRow === button.row && toColumn === button.column) return
    onButtonMove?.(button, toRow, toColumn)
  }

  return (
    <View
      style={[styles.grid, { gap }]}
      onLayout={(e) => setGridSize(e.nativeEvent.layout)}
    >
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={[styles.row, { gap }]}>
          {Array.from({ length: columns }, (_, column) => {
            const button = byPosition.get(`${row}:${column}`)
            if (button) {
              const symbolButton = (
                <SymbolButton
                  key={button.id}
                  button={button}
                  isSelected={isEditMode && button.id === selectedButtonId}
                  isFlashing={button.id === flashButtonId}
                  dimmed={
                    filterState?.mode === 'filtering' && !filterState.ids.has(button.id)
                  }
                  showCheck={
                    filterState?.mode === 'editing' && filterState.ids.has(button.id)
                  }
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
                symbolButton
              )
            }
            if (isEditMode && onEmptyCellPress) {
              // §5.6: dashed outline on empty cells — tap to add a button
              return (
                <Pressable
                  key={`empty-${column}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Add button at row ${row + 1}, column ${column + 1}`}
                  onPress={() => onEmptyCellPress(row, column)}
                  style={({ pressed }) => [
                    styles.emptyCellEditable,
                    pressed && styles.pressed,
                  ]}
                />
              )
            }
            return <View key={`empty-${column}`} style={styles.emptyCell} />
          })}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flex: 1,
    padding: LAYOUT.gridPadding,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
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
