import { Pressable, StyleSheet, View } from 'react-native'
import { LAYOUT } from '../../constants/layout'
import type { Button } from '../../types/models'
import { SymbolButton } from './SymbolButton'

interface SymbolGridProps {
  rows: number
  columns: number
  buttons: Button[]
  isEditMode?: boolean
  selectedButtonId?: string | null
  onButtonPress: (button: Button) => void
  onButtonLongPress?: (button: Button) => void
  onEmptyCellPress?: (row: number, column: number) => void // edit mode only
}

export function SymbolGrid({
  rows,
  columns,
  buttons,
  isEditMode,
  selectedButtonId,
  onButtonPress,
  onButtonLongPress,
  onEmptyCellPress,
}: SymbolGridProps) {
  const byPosition = new Map(
    buttons
      .filter((b) => isEditMode || !b.isHidden)
      .map((b) => [`${b.row}:${b.column}`, b]),
  )

  return (
    <View style={styles.grid}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: columns }, (_, column) => {
            const button = byPosition.get(`${row}:${column}`)
            if (button) {
              return (
                <SymbolButton
                  key={button.id}
                  button={button}
                  isSelected={isEditMode && button.id === selectedButtonId}
                  onPress={onButtonPress}
                  onLongPress={onButtonLongPress}
                />
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
    gap: LAYOUT.gridGap,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: LAYOUT.gridGap,
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
