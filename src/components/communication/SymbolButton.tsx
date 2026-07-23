import { Pressable, StyleSheet, Text } from 'react-native'
import { LAYOUT } from '../../constants/layout'
import type { Button } from '../../types/models'

interface SymbolButtonProps {
  button: Button
  onPress: (button: Button) => void
  onLongPress?: (button: Button) => void
}

// Text-only rendering for now (§6.1 case d) — symbol images arrive with
// the asset pipeline.
export function SymbolButton({ button, onPress, onLongPress }: SymbolButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        button.isNavigationButton ? `${button.label}, opens page` : button.label
      }
      onPress={() => onPress(button)}
      onLongPress={onLongPress ? () => onLongPress(button) : undefined}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: button.backgroundColor,
          borderColor: button.borderColor,
          borderWidth: button.borderWidth,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: button.labelColor }]} numberOfLines={2}>
        {button.label}
      </Text>
      {button.isNavigationButton && <Text style={styles.navArrow}>➜</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LAYOUT.buttonRadius,
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
    textAlign: 'center',
  },
  navArrow: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    fontSize: 11,
    color: '#888888',
  },
})
