import { MaterialIcons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { Image } from 'expo-image'
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
import { FONTS } from '../../constants/typography'
import { useTheme } from '../../hooks/useTheme'
import { playAttentionChime } from '../../services/attentionSound'
import { getSymbolUri } from '../../services/SymbolService'
import { ttsService } from '../../services/TTSService'
import { useMessageStore } from '../../stores/messageStore'
import { useUserStore } from '../../stores/userStore'
import { MessageHistoryModal } from './MessageHistoryModal'

// §AM-05: stable ids so the scan engine can target the message actions
export const SCAN_SPEAK = 'scan-speak'
export const SCAN_BACKSPACE = 'scan-backspace'

export function MessageBar({ scanHighlightIds }: { scanHighlightIds?: Set<string> }) {
  const tokens = useMessageStore((s) => s.tokens)
  const speakMessage = useMessageStore((s) => s.speakMessage)
  const clearMessage = useMessageStore((s) => s.clearMessage)
  const deleteLastToken = useMessageStore((s) => s.deleteLastToken)
  const removeToken = useMessageStore((s) => s.removeToken)
  const speakingTokenId = useMessageStore((s) => s.speakingTokenId)
  const [actionsVisible, setActionsVisible] = useState(false)
  const [historyVisible, setHistoryVisible] = useState(false)
  const [actionFeedback, setActionFeedback] = useState('')
  const scanned = (id: string) => scanHighlightIds?.has(id)
  const theme = useTheme()

  const activeUser = useUserStore((s) => s.activeUser)
  const showAttention = activeUser?.attentionButton !== false // default on
  const emergencyPhrase = (activeUser?.emergencyPhrase ?? 'I need help.').trim()

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
    <View
      style={[
        styles.bar,
        { backgroundColor: theme.surface, borderBottomColor: theme.border },
      ]}
    >
      {/* Tap anywhere on the strip (or a word) to speak — the big, forgiving
          target competitors use. Empty gaps speak via this wrapper; words
          speak on tap and delete on long-press. */}
      <Pressable
        style={styles.tokens}
        onPress={tokens.length ? speakMessage : undefined}
      >
        <ScrollView
          horizontal
          style={styles.tokens}
          contentContainerStyle={styles.tokensContent}
          // §17.1: announce added words without moving screen-reader focus
          accessibilityLiveRegion="polite"
        >
          {tokens.length === 0 && (
            <Text style={[styles.emptyHint, { color: theme.textMuted }]}>
              Tap buttons to build a message…
            </Text>
          )}
          {tokens.map((token) => {
            const uri =
              token.customSymbolUri ??
              (token.symbolId ? getSymbolUri(token.symbolId) : null)
            const speaking = token.id === speakingTokenId
            return (
              <Pressable
                key={token.id}
                accessibilityRole="button"
                accessibilityLabel={token.text}
                accessibilityHint="Speaks the message. Press and hold to remove this word."
                onPress={speakMessage}
                onLongPress={() => removeToken(token.id)}
                delayLongPress={500}
                style={({ pressed }) => [
                  styles.tokenPill,
                  speaking
                    ? { backgroundColor: theme.accent, borderColor: theme.accent }
                    : { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}
              >
                {uri && (
                  <Image source={{ uri }} style={styles.tokenSymbol} contentFit="contain" />
                )}
                <Text
                  style={[styles.tokenText, { color: speaking ? '#FFFFFF' : theme.text }]}
                >
                  {token.text}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </Pressable>

      <View style={styles.actions}>
        {/* Quick-fire buttons — always available, independent of the
            composed message: a bell to get attention and a one-tap
            emergency phrase. */}
        {showAttention && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Get attention"
            onPress={playAttentionChime}
            style={({ pressed }) => [
              styles.smallButton,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="notifications-active" size={22} color={theme.icon} />
          </Pressable>
        )}
        {emergencyPhrase !== '' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Speak emergency phrase"
            onPress={() => ttsService.speak(emergencyPhrase)}
            style={({ pressed }) => [
              styles.smallButton,
              styles.emergencyButton,
              { backgroundColor: theme.surfaceAlt },
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="warning" size={20} color={UI_COLORS.clearRed} />
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Message actions"
          onPress={() => {
            setActionFeedback('')
            setActionsVisible(true)
          }}
          style={({ pressed }) => [
            styles.smallButton,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="more-horiz" size={22} color={theme.icon} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Speak message"
          onPress={speakMessage}
          style={({ pressed }) => [
            styles.speakButton,
            scanned(SCAN_SPEAK) && styles.scanHighlight,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="play-arrow" size={26} color="#FFFFFF" />
          <Text style={styles.speakText}>Speak</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete last word"
          onPress={deleteLastToken}
          style={({ pressed }) => [
            styles.smallButton,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            scanned(SCAN_BACKSPACE) && styles.scanHighlight,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="backspace" size={20} color={theme.icon} />
        </Pressable>
      </View>

      <Modal
        visible={actionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionsVisible(false)}
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.backdrop }]}
          onPress={() => setActionsVisible(false)}
        >
          <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
            {messageText !== '' && (
              <>
                <Text
                  style={[styles.sheetMessage, { color: theme.textMuted }]}
                  numberOfLines={2}
                >
                  “{messageText}”
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Copy message"
                  onPress={copyMessage}
                  style={({ pressed }) => [
                    styles.sheetButton,
                    { borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.sheetButtonText, { color: theme.text }]}>
                    {actionFeedback || 'Copy message'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Share message"
                  onPress={shareMessage}
                  style={({ pressed }) => [
                    styles.sheetButton,
                    { borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.sheetButtonText, { color: theme.text }]}>
                    Share message
                  </Text>
                </Pressable>
                {/* Clear-all lives here (not on the bar) so it isn't confused
                    with the ⌫ backspace, which deletes only the last word */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear message"
                  onPress={() => {
                    clearMessage()
                    setActionsVisible(false)
                  }}
                  style={({ pressed }) => [
                    styles.sheetButton,
                    { borderColor: UI_COLORS.clearRed },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.sheetButtonText, { color: UI_COLORS.clearRed }]}>
                    Clear message
                  </Text>
                </Pressable>
              </>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Recent messages"
              onPress={() => {
                setActionsVisible(false)
                setHistoryVisible(true)
              }}
              style={({ pressed }) => [
                styles.sheetButton,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.sheetButtonText, { color: theme.text }]}>
                Recent messages
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <MessageHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />
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
  emptyHint: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: '#B0B0B0',
  },
  tokenPill: {
    alignItems: 'center',
    backgroundColor: UI_COLORS.barBackground,
    borderWidth: 1,
    borderColor: UI_COLORS.barBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 52,
  },
  tokenSymbol: {
    width: 34,
    height: 34,
  },
  tokenText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UI_COLORS.speakGreen,
    borderRadius: 10,
    paddingHorizontal: 18,
    height: 60,
    minWidth: 120,
    gap: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  speakText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 19,
  },
  smallButton: {
    backgroundColor: UI_COLORS.barBackground,
    borderWidth: 1,
    borderColor: UI_COLORS.barBorder,
    borderRadius: 10,
    minWidth: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyButton: {
    borderColor: UI_COLORS.clearRed,
  },
  scanHighlight: {
    borderWidth: 4,
    borderColor: '#1565C0',
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
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
})
