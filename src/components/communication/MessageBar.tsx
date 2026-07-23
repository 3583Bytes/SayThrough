import * as Clipboard from 'expo-clipboard'
import { useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { UI_COLORS } from '../../constants/colors'
import { LAYOUT } from '../../constants/layout'
import { useMessageStore } from '../../stores/messageStore'

export function MessageBar() {
  const tokens = useMessageStore((s) => s.tokens)
  const speakMessage = useMessageStore((s) => s.speakMessage)
  const clearMessage = useMessageStore((s) => s.clearMessage)
  const deleteLastToken = useMessageStore((s) => s.deleteLastToken)
  const [actionsVisible, setActionsVisible] = useState(false)
  const [actionFeedback, setActionFeedback] = useState('')

  const messageText = tokens.map((t) => t.text).join(' ')

  // How users hand a message to someone not in the room (texts, email,
  // Google Classroom) — MVP spec §5.3
  const copyMessage = async () => {
    await Clipboard.setStringAsync(messageText)
    setActionFeedback('Copied!')
    setTimeout(() => setActionsVisible(false), 600)
  }

  const shareMessage = async () => {
    try {
      await Share.share({ message: messageText })
      setActionsVisible(false)
    } catch {
      await copyMessage() // no share target available — copy instead
    }
  }

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
        {tokens.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Message actions"
            onPress={() => {
              setActionFeedback('')
              setActionsVisible(true)
            }}
            style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}
          >
            <Text style={styles.smallButtonText}>⋯</Text>
          </Pressable>
        )}
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

      <Modal
        visible={actionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionsVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setActionsVisible(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetMessage} numberOfLines={2}>
              “{messageText}”
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copy message"
              onPress={copyMessage}
              style={({ pressed }) => [styles.sheetButton, pressed && styles.pressed]}
            >
              <Text style={styles.sheetButtonText}>
                {actionFeedback || 'Copy message'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share message"
              onPress={shareMessage}
              style={({ pressed }) => [styles.sheetButton, pressed && styles.pressed]}
            >
              <Text style={styles.sheetButtonText}>Share message</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  sheetMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 4,
  },
  sheetButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: UI_COLORS.barBorder,
  },
  sheetButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
})
