import { StyleSheet, View } from 'react-native'
import { LAYOUT } from '../../constants/layout'
import type { Button } from '../../types/models'
import { SymbolButton } from './SymbolButton'

interface SymbolGridProps {
  rows: number
  columns: number
  buttons: Button[]
  onButtonPress: (button: Button) => void
  onButtonLongPress?: (button: Button) => void
}

export function SymbolGrid({
  rows,
  columns,
  buttons,
  onButtonPress,
  onButtonLongPress,
}: SymbolGridProps) {
  const byPosition = new Map(
    buttons.filter((b) => !b.isHidden).map((b) => [`${b.row}:${b.column}`, b]),
  )

  return (
    <View style={styles.grid}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: columns }, (_, column) => {
            const button = byPosition.get(`${row}:${column}`)
            return button ? (
              <SymbolButton
                key={button.id}
                button={button}
                onPress={onButtonPress}
                onLongPress={onButtonLongPress}
              />
            ) : (
              <View key={`empty-${column}`} style={styles.emptyCell} />
            )
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
})
