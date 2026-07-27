import { MaterialIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRef } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LAYOUT } from '../../constants/layout'
import { FONTS } from '../../constants/typography'
import { getSymbolUri } from '../../services/SymbolService'
import { useUserStore } from '../../stores/userStore'
import type { Button } from '../../types/models'

interface SymbolButtonProps {
  button: Button
  isSelected?: boolean // edit mode: blue selection border (§5.6)
  isFlashing?: boolean // §12.4: pulse after a search jump
  dimmed?: boolean // §12.2: filtered out — visible for modeling, inert
  showCheck?: boolean // word-list editing: included badge
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
  isFlashing,
  dimmed,
  showCheck,
  accommodate,
  onPress,
  onLongPress,
}: SymbolButtonProps) {
  const activeUser = useUserStore((s) => s.activeUser)
  const textScale = activeUser?.labelTextScale ?? 1
  const holdDuration = accommodate ? (activeUser?.touchHoldDuration ?? 0) : 0
  const debounce = accommodate ? (activeUser?.touchDebounce ?? 0) : 0
  const guardSecondTouch = accommodate ? (activeUser?.ignoreSecondTouch ?? false) : false

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firedByHold = useRef(false)
  const blocked = useRef(false)

  const activate = () => {
    if (dimmed) return // filtered out — visible so a partner can model
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
        // AAC convention: navigation "folder" buttons look distinct
        button.isNavigationButton && styles.navButton,
        isSelected && styles.selected,
        isFlashing && styles.flashing,
        dimmed && styles.dimmed,
        pressed && !dimmed && styles.pressed,
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
            style={[
              styles.symbolLabel,
              { color: button.labelColor, fontSize: 13 * textScale },
            ]}
            numberOfLines={1}
          >
            {button.label}
          </Text>
        </View>
      ) : (
        <Text
          style={[
            styles.label,
            { color: button.labelColor, fontSize: 16 * textScale },
          ]}
          numberOfLines={2}
        >
          {button.label}
        </Text>
      )}
      {button.isNavigationButton && (
        <View style={styles.navChevron}>
          <MaterialIcons name="chevron-right" size={18} color="#FFFFFF" />
        </View>
      )}
      {showCheck && (
        <View style={styles.checkBadge}>
          <MaterialIcons name="check" size={13} color="#FFFFFF" />
        </View>
      )}
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  // Navigation buttons read as "doorways/folders": a teal tab bar along
  // the bottom + a clear chevron badge, distinct from the pastel
  // Fitzgerald word colors so they're never mistaken for words
  navButton: {
    borderWidth: 1.5,
    borderColor: '#CFD8DC',
    borderBottomWidth: 5,
    borderBottomColor: '#00897B',
  },
  selected: {
    borderWidth: 3,
    borderColor: '#1976D2',
  },
  flashing: {
    borderWidth: 3,
    borderColor: '#FF9800',
  },
  dimmed: {
    opacity: 0.3,
  },
  checkBadge: {
    position: 'absolute',
    top: 3,
    left: 3,
    backgroundColor: '#2E7D32',
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: FONTS.bold,
    fontSize: 13,
    textAlign: 'center',
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    textAlign: 'center',
  },
  navChevron: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#00897B',
    borderRadius: 11,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
