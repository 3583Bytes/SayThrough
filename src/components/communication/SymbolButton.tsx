import { Image } from 'expo-image'
import { useRef } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LAYOUT } from '../../constants/layout'
import { getSymbolUri } from '../../services/SymbolService'
import { useUserStore } from '../../stores/userStore'
import type { Button } from '../../types/models'

interface SymbolButtonProps {
  button: Button
  isSelected?: boolean // edit mode: blue selection border (§5.6)
  accommodate?: boolean // apply touch accommodations (use mode only)
  onPress: (button: Button) => void
  onLongPress?: (button: Button) => void
}

// Shared across all buttons: repeat-tap debounce + second-touch guard
let lastActivationAt = 0
let touchInProgress = false

export function SymbolButton({
  button,
  isSelected,
  accommodate,
  onPress,
  onLongPress,
}: SymbolButtonProps) {
  const activeUser = useUserStore((s) => s.activeUser)
  const holdDuration = accommodate ? (activeUser?.touchHoldDuration ?? 0) : 0
  const debounce = accommodate ? (activeUser?.touchDebounce ?? 0) : 0
  const guardSecondTouch = accommodate ? (activeUser?.ignoreSecondTouch ?? false) : false

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firedByHold = useRef(false)
  const blocked = useRef(false)

  const activate = () => {
    const now = Date.now()
    if (debounce > 0 && now - lastActivationAt < debounce) return
    lastActivationAt = now
    onPress(button)
  }

  const handlePressIn = () => {
    if (guardSecondTouch && touchInProgress) {
      blocked.current = true
      return
    }
    touchInProgress = true
    blocked.current = false
    firedByHold.current = false
    if (holdDuration > 0) {
      // AM-01 hold-to-activate: fires while still touching, once the
      // hold duration elapses; releasing earlier cancels
      holdTimer.current = setTimeout(() => {
        firedByHold.current = true
        activate()
      }, holdDuration)
    }
  }

  const handlePressOut = () => {
    touchInProgress = false
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }

  const handlePress = () => {
    if (blocked.current) return
    if (holdDuration > 0) return // hold path activates via the timer
    activate()
  }
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
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
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
