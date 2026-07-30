import { MaterialIcons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { FONTS } from '../../constants/typography'
import { useTheme } from '../../hooks/useTheme'
import {
  loadHistory,
  type MessageHistory,
  toggleFavorite,
} from '../../services/messageHistory'
import { useMessageStore } from '../../stores/messageStore'
import { useUserStore } from '../../stores/userStore'

// Recent + favorite messages (§competitive: Proloquo2Go/TD Snap re-speak).
// Tap a phrase to drop it back into the bar; star it to keep it around.
export function MessageHistoryModal({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) {
  const theme = useTheme()
  const userId = useUserStore((s) => s.activeUser?.id)
  const loadMessage = useMessageStore((s) => s.loadMessage)
  const [history, setHistory] = useState<MessageHistory>({
    recents: [],
    favorites: [],
  })

  useEffect(() => {
    if (visible) loadHistory(userId).then(setHistory)
  }, [visible, userId])

  const favSet = new Set(history.favorites)
  const recentsOnly = history.recents.filter((m) => !favSet.has(m))
  const empty = history.favorites.length === 0 && recentsOnly.length === 0

  const renderRow = (text: string) => {
    const starred = favSet.has(text)
    return (
      <View key={text} style={[styles.row, { borderColor: theme.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Use phrase: ${text}`}
          onPress={() => {
            loadMessage(text)
            onClose()
          }}
          style={({ pressed }) => [styles.rowText, pressed && styles.pressed]}
        >
          <Text style={[styles.phrase, { color: theme.text }]} numberOfLines={2}>
            {text}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={starred ? `Unstar: ${text}` : `Star: ${text}`}
          onPress={async () => setHistory(await toggleFavorite(userId, text))}
          style={({ pressed }) => [styles.starBtn, pressed && styles.pressed]}
        >
          <MaterialIcons
            name={starred ? 'star' : 'star-border'}
            size={24}
            color={starred ? '#F9A825' : theme.icon}
          />
        </Pressable>
      </View>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.backdrop }]}
        onPress={onClose}
      >
        <Pressable style={[styles.card, { backgroundColor: theme.surface }]} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Recent messages</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close recent messages"
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <MaterialIcons name="close" size={22} color={theme.icon} />
            </Pressable>
          </View>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {empty && (
              <Text style={[styles.emptyHint, { color: theme.textMuted }]}>
                Messages you speak will show up here so you can say them again.
              </Text>
            )}
            {history.favorites.length > 0 && (
              <Text style={[styles.section, { color: theme.textMuted }]}>Favorites</Text>
            )}
            {history.favorites.map(renderRow)}
            {recentsOnly.length > 0 && (
              <Text style={[styles.section, { color: theme.textMuted }]}>Recent</Text>
            )}
            {recentsOnly.map(renderRow)}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 340,
    maxWidth: '92%',
    maxHeight: '78%',
    borderRadius: 12,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: 4,
  },
  section: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  rowText: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 8,
  },
  phrase: {
    fontFamily: FONTS.regular,
    fontSize: 16,
  },
  starBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHint: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 24,
  },
  pressed: {
    opacity: 0.6,
  },
})
