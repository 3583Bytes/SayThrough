import { useMemo } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import type { PartOfSpeech } from '../../constants/colors'
import { FONTS } from '../../constants/typography'
import { useT } from '../../hooks/useT'
import { useTheme } from '../../hooks/useTheme'
import { useLanguage } from '../../hooks/useT'
import { useUserStore } from '../../stores/userStore'
import { wordForms } from '../../services/morphology'
import { useMessageStore } from '../../stores/messageStore'

// §Tier-1 word forms: long-press a word to pick an inflection instead of the
// base word. What that offers is language-specific — English gives tense and
// plural, Spanish gives person, gender and number — so the modal reads the
// active profile's language and passes the message bar as context, which is
// what lets a Spanish adjective agree with the noun already in the sentence
// (§19.7).
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
  const t = useT()
  const language = useLanguage()
  const grammaticalGender = useUserStore((s) => s.activeUser?.grammaticalGender)
  const tokens = useMessageStore((s) => s.tokens)
  const forms = useMemo(
    () =>
      wordForms(word, pos, language, {
        precedingWords: tokens.map((tk) => tk.text),
        grammaticalGender,
      }),
    [word, pos, language, tokens, grammaticalGender],
  )

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.backdrop }]}
        onPress={onClose}
      >
        <Pressable style={[styles.card, { backgroundColor: theme.surface }]} onPress={() => {}}>
          <Text style={[styles.title, { color: theme.textMuted }]}>
            {t('forms.title', { word })}
          </Text>
          <View style={styles.grid}>
            {forms.map((form) => (
              <Pressable
                key={`${form.value}-${form.hint}`}
                accessibilityRole="button"
                accessibilityLabel={t('forms.insert', { word: form.value })}
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
