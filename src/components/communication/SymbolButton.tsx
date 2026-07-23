import { Image } from 'expo-image'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LAYOUT } from '../../constants/layout'
import { getSymbolUri } from '../../services/SymbolService'
import type { Button } from '../../types/models'

interface SymbolButtonProps {
  button: Button
  isSelected?: boolean // edit mode: blue selection border (§5.6)
  onPress: (button: Button) => void
  onLongPress?: (button: Button) => void
}

export function SymbolButton({
  button,
  isSelected,
  onPress,
  onLongPress,
}: SymbolButtonProps) {
  const symbolUri = button.customSymbolUri
    ? button.customSymbolUri
    : button.symbolId
      ? getSymbolUri(button.symbolId)
      : null

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
        isSelected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      {symbolUri ? (
        // §5.3: symbol fills the top ~65%, label the bottom
        <View style={styles.withSymbol}>
          <Image
            source={{ uri: symbolUri }}
            style={styles.symbol}
            contentFit="contain"
            transition={100}
          />
          <Text
            style={[styles.symbolLabel, { color: button.labelColor }]}
            numberOfLines={1}
          >
            {button.label}
          </Text>
        </View>
      ) : (
        <Text style={[styles.label, { color: button.labelColor }]} numberOfLines={2}>
          {button.label}
        </Text>
      )}
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
  selected: {
    borderWidth: 3,
    borderColor: '#1976D2',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  withSymbol: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  symbol: {
    flex: 1,
    alignSelf: 'stretch',
  },
  symbolLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
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
