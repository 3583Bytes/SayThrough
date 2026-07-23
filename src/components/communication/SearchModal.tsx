import { useEffect, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { UI_COLORS } from '../../constants/colors'
import { ttsService } from '../../services/TTSService'
import { storage } from '../../storage'
import { useNavigationStore } from '../../stores/navigationStore'
import type { Button } from '../../types/models'

interface SearchModalProps {
  visible: boolean
  onClose: () => void
}

// §12.4 v1.0 vocabulary search: substring match over the active page
// set; tap a result to jump to its page (button flashes), or speak it
// directly from the results. Path highlighting is v1.2.
export function SearchModal({ visible, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ button: Button; pageName: string }>>([])

  useEffect(() => {
    if (!visible) return
    const pageSetId = useNavigationStore.getState().activePageSetId
    if (!pageSetId || !query.trim()) {
      setResults([])
      return
    }
    let cancelled = false
    storage.searchButtons(pageSetId, query).then((found) => {
      if (!cancelled) setResults(found.slice(0, 20))
    })
    return () => {
      cancelled = true
    }
  }, [query, visible])

  const jumpTo = (result: { button: Button; pageName: string }) => {
    const nav = useNavigationStore.getState()
    nav.navigateTo(result.button.pageId)
    nav.flashButton(result.button.id)
    setQuery('')
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Find a word…"
              autoFocus
              style={styles.input}
              accessibilityLabel="Search vocabulary"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close search"
              onPress={() => {
                setQuery('')
                onClose()
              }}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.results}>
            {results.map((result) => (
              <View key={result.button.id} style={styles.resultRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Go to ${result.button.label} on ${result.pageName}`}
                  onPress={() => jumpTo(result)}
                  style={styles.resultMain}
                >
                  <Text style={styles.resultLabel}>{result.button.label}</Text>
                  <Text style={styles.resultPage}>on {result.pageName}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Speak ${result.button.label}`}
                  onPress={() => ttsService.speak(result.button.label)}
                  style={({ pressed }) => [styles.speakButton, pressed && styles.pressed]}
                >
                  <Text style={styles.speakIcon}>▶</Text>
                </Pressable>
              </View>
            ))}
            {query.trim() !== '' && results.length === 0 && (
              <Text style={styles.empty}>No words found for “{query.trim()}”</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    paddingTop: 60,
  },
  card: {
    width: '90%',
    maxWidth: 480,
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: UI_COLORS.buttonBorder,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#666666',
  },
  results: {
    flexGrow: 0,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultMain: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultPage: {
    fontSize: 12,
    color: '#888888',
  },
  speakButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakIcon: {
    color: UI_COLORS.speakGreen,
    fontSize: 14,
  },
  empty: {
    padding: 12,
    color: '#888888',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
})
