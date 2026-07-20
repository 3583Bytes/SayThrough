import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { UI_COLORS } from '../../constants/colors'
import { LAYOUT } from '../../constants/layout'
import { useMessageStore } from '../../stores/messageStore'

export function MessageBar() {
  const tokens = useMessageStore((s) => s.tokens)
  const speakMessage = useMessageStore((s) => s.speakMessage)
  const clearMessage = useMessageStore((s) => s.clearMessage)
  const deleteLastToken = useMessageStore((s) => s.deleteLastToken)

  return (
    <View style={styles.bar}>
      <ScrollView
        horizontal
        style={styles.tokens}
        contentContainerStyle={styles.tokensContent}
        // §17.1: announce added words without moving screen-reader focus
        accessibilityLiveRegion="polite"
      >
        {tokens.map((token) => (
          <View key={token.id} style={styles.tokenPill}>
            <Text style={styles.tokenText}>{token.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Speak message"
          onPress={speakMessage}
          style={({ pressed }) => [styles.speakButton, pressed && styles.pressed]}
        >
          <Text style={styles.speakText}>▶ Speak</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete last word"
          onPress={deleteLastToken}
          style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}
        >
          <Text style={styles.smallButtonText}>⌫</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear message"
          onPress={clearMessage}
          style={({ pressed }) => [
            styles.smallButton,
            styles.clearButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.clearButtonText}>✕</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    height: LAYOUT.messageBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: UI_COLORS.messageBarBorder,
    paddingHorizontal: 8,
    gap: 8,
  },
  tokens: {
    flex: 1,
  },
  tokensContent: {
    alignItems: 'center',
    gap: 6,
  },
  tokenPill: {
    backgroundColor: UI_COLORS.barBackground,
    borderWidth: 1,
    borderColor: UI_COLORS.barBorder,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tokenText: {
    fontSize: 18,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speakButton: {
    backgroundColor: UI_COLORS.speakGreen,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  smallButton: {
    backgroundColor: UI_COLORS.barBackground,
    borderWidth: 1,
    borderColor: UI_COLORS.barBorder,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: {
    fontSize: 18,
    color: UI_COLORS.backspaceGray,
  },
  clearButton: {
    borderColor: UI_COLORS.clearRed,
  },
  clearButtonText: {
    fontSize: 16,
    color: UI_COLORS.clearRed,
  },
  pressed: {
    opacity: 0.7,
  },
})
