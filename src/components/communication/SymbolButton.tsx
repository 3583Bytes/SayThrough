import { Pressable, StyleSheet, Text } from 'react-native'
import { POS_COLORS, UI_COLORS } from '../../constants/colors'
import { LAYOUT } from '../../constants/layout'
import type { GridButton } from '../../data/corePage'

interface SymbolButtonProps {
  button: GridButton
  onPress: (button: GridButton) => void
}

// Text-only rendering for now (§6.1 case d) — symbol images arrive with
// the asset pipeline.
export function SymbolButton({ button, onPress }: SymbolButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={button.label}
      onPress={() => onPress(button)}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: POS_COLORS[button.pos] },
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.label} numberOfLines={2}>
        {button.label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LAYOUT.buttonRadius,
    borderWidth: 1,
    borderColor: UI_COLORS.buttonBorder,
    minHeight: LAYOUT.minButtonSize,
    padding: 4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_COLORS.label,
    textAlign: 'center',
  },
})
