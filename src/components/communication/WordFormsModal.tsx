import { useMemo } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import type { PartOfSpeech } from '../../constants/colors'
import { FONTS } from '../../constants/typography'
import { useTheme } from '../../hooks/useTheme'
import { wordForms } from '../../services/morphology'

// §Tier-1 word forms: long-press a word to pick an inflection (plural,
// tense, comparative, possessive) instead of the base word.
export function WordFormsModal({
  visible,
  word,
  pos,
  onPick,
  onClose,
}: {
  visible: boolean
  word: string
  pos?: PartOfSpeech
  onPick: (value: string) => void
  onClose: () => void
}) {
  const theme = useTheme()
  const forms = useMemo(() => wordForms(word, pos), [word, pos])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.backdrop }]}
        onPress={onClose}
      >
        <Pressable style={[styles.card, { backgroundColor: theme.surface }]} onPress={() => {}}>
          <Text style={[styles.title, { color: theme.textMuted }]}>
            Forms of “{word}”
          </Text>
          <View style={styles.grid}>
            {forms.map((form) => (
              <Pressable
                key={`${form.value}-${form.hint}`}
                accessibilityRole="button"
                accessibilityLabel={`Insert ${form.value}`}
                onPress={() => onPick(form.value)}
                style={({ pressed }) => [
                  styles.chip,
                  { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.chipValue, { color: theme.text }]}>{form.value}</Text>
                {form.hint !== '' && (
                  <Text style={[styles.chipHint, { color: theme.textMuted }]}>
                    {form.hint}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
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
    width: 360,
    maxWidth: '92%',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  chip: {
    minWidth: 92,
    minHeight: 60,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipValue: {
    fontFamily: FONTS.bold,
    fontSize: 20,
  },
  chipHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.6,
  },
})
