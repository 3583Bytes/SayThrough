import { Image } from 'expo-image'
import { useTheme } from '../../hooks/useTheme'
import { useT } from '../../hooks/useT'
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
import { searchSymbols, type SymbolResult } from '../../services/symbolCatalog'
import { useUserStore } from '../../stores/userStore'

interface SymbolPickerModalProps {
  visible: boolean
  initialQuery?: string // pre-fill with the button label (§4.9 suggestions)
  onSelect: (symbolId: string) => void
  onClose: () => void
}

// §5.7 symbol picker — local search over the hosted catalog. Camera and
// web-image search arrive later; photo library upload lives in the
// button editor next to this.
export function SymbolPickerModal({
  visible,
  initialQuery,
  onSelect,
  onClose,
}: SymbolPickerModalProps) {
  const theme = useTheme()
  const t = useT()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SymbolResult[]>([])
  // §19.7 — search the catalog in the profile's language, not English.
  const language = useUserStore((s) => s.activeUser?.language)

  useEffect(() => {
    if (visible) setQuery(initialQuery ?? '')
  }, [visible, initialQuery])

  useEffect(() => {
    let cancelled = false
    searchSymbols(query, language).then((found) => {
      if (!cancelled) setResults(found)
    })
    return () => {
      cancelled = true
    }
  }, [query, language])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('edit.searchSymbols')}
              autoFocus
              style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
              accessibilityLabel={t('edit.searchSymbolsLabel')}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('edit.closePicker')}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Text style={[styles.closeText, { color: theme.textMuted }]}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.grid}>
            {results.map((result) => (
              <Pressable
                key={result.id}
                accessibilityRole="button"
                accessibilityLabel={t('edit.symbolResult', { label: result.label })}
                onPress={() => onSelect(result.id)}
                style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
              >
                <Image source={{ uri: result.uri }} style={styles.symbol} contentFit="contain" />
                <Text style={[styles.cellLabel, { color: theme.textMuted }]} numberOfLines={1}>
                  {result.label}
                </Text>
              </Pressable>
            ))}
            {query.trim() !== '' && results.length === 0 && (
              <Text style={[styles.empty, { color: theme.textMuted }]}>
                No symbols found — the catalog grows as more of the library
                is hosted. You can also use a photo instead.
              </Text>
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
    paddingTop: 50,
  },
  card: {
    width: '92%',
    maxWidth: 520,
    maxHeight: '75%',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: 88,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UI_COLORS.buttonBorder,
    borderRadius: 8,
    padding: 6,
    gap: 4,
  },
  symbol: {
    width: 64,
    height: 64,
  },
  cellLabel: {
    fontSize: 11,
    color: '#555555',
  },
  empty: {
    padding: 12,
    color: '#888888',
  },
  pressed: {
    opacity: 0.6,
  },
})
