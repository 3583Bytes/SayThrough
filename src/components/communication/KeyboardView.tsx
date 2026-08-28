import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { UI_COLORS } from '../../constants/colors'
import { FONTS } from '../../constants/typography'
import { usePredictions } from '../../hooks/usePredictions'
import { useScanning, type ScanItem } from '../../hooks/useScanning'
import { useTheme } from '../../hooks/useTheme'
import { useT } from '../../hooks/useT'
import { applyCaseOf } from '../../services/prediction'
import { useMessageStore } from '../../stores/messageStore'
import { useUserStore } from '../../stores/userStore'
import { PredictionBar, predictionSlotId } from './PredictionBar'

// §5.5 keyboard: QWERTY type-to-speak into the message bar, with the §18
// prediction bar above it. This is the escape hatch for any word without a
// button, so it has to be able to write real sentences — that means the
// apostrophe (no "I'm", "don't" or "can't" without it) and end punctuation,
// not just letters.
//
// The letter layout never moves. Digits and symbols live behind a mode toggle
// rather than being crammed in, so the motor plan for the letters is stable
// (§19.6, applied to the keyboard).
const LETTER_ROWS = ['qwertyuiop', "asdfghjkl'", 'zxcvbnm']
const SYMBOL_ROWS = ['1234567890', '-/:;()$&@"', ',!%+=#*']

export function KeyboardView({ onClose }: { onClose: () => void }) {
  const theme = useTheme()
  const t = useT()
  const [buffer, setBuffer] = useState('')
  const [shift, setShift] = useState(false)
  const [symbols, setSymbols] = useState(false)
  const activeUser = useUserStore((s) => s.activeUser)
  const appendToken = useMessageStore((s) => s.appendToken)
  const appendToLastToken = useMessageStore((s) => s.appendToLastToken)
  const deleteLastToken = useMessageStore((s) => s.deleteLastToken)
  const speakMessage = useMessageStore((s) => s.speakMessage)

  const predictions = usePredictions(buffer)
  const rows = symbols ? SYMBOL_ROWS : LETTER_ROWS

  const commit = () => {
    const word = buffer.trim()
    if (word) appendToken(word)
    setBuffer('')
  }

  const typeKey = (key: string) => {
    setBuffer((b) => b + (shift ? key.toUpperCase() : key))
    setShift(false)
  }

  // Punctuation closes the current word rather than starting a new token.
  const punctuate = (mark: string) => {
    const word = buffer.trim()
    if (word) {
      appendToken(word + mark)
      setBuffer('')
    } else {
      appendToLastToken(mark)
    }
  }

  const backspace = () => {
    if (buffer) setBuffer((b) => b.slice(0, -1))
    else deleteLastToken()
  }

  const speak = () => {
    commit()
    speakMessage()
  }

  const selectPrediction = (word: string) => {
    // Mirror what the user typed — "Wa" → "Want". With an empty buffer, an
    // armed shift still capitalizes.
    appendToken(applyCaseOf(buffer || (shift ? 'A' : ''), word))
    setBuffer('')
    setShift(false)
  }

  // §AM-05 — the keyboard scans itself while open. Without this a switch user
  // cannot type at all, and prediction, which saves the most keystrokes for
  // the slowest access methods, would be unreachable by the people it helps
  // most. Groups mirror the visual rows so the highlight matches the layout.
  const scanGroups = useMemo<ScanItem[][]>(() => {
    const groups: ScanItem[][] = [
      predictions.map((prediction, index) => ({
        id: predictionSlotId(index),
        label: prediction.word,
        activate: () => selectPrediction(prediction.word),
      })),
    ]

    rows.forEach((row, index) => {
      const keys: ScanItem[] = row.split('').map((key) => ({
        id: `key-${key}`,
        label: key,
        activate: () => typeKey(key),
      }))
      if (index === 2) {
        if (!symbols) {
          keys.unshift({ id: 'key-shift', label: 'Shift', activate: () => setShift((s) => !s) })
        }
        keys.push({ id: 'key-backspace', label: 'Delete', activate: backspace })
      }
      groups.push(keys)
    })

    groups.push([
      {
        id: 'key-mode',
        label: symbols ? 'Letters' : 'Numbers and symbols',
        activate: () => setSymbols((s) => !s),
      },
      { id: 'key-space', label: 'Space', activate: commit },
      { id: 'key-period', label: 'Period', activate: () => punctuate('.') },
      { id: 'key-question', label: 'Question mark', activate: () => punctuate('?') },
      { id: 'key-speak', label: 'Speak', activate: speak },
      { id: 'key-close', label: 'Close keyboard', activate: onClose },
    ])

    return groups.filter((group) => group.length > 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictions, rows, symbols, shift, buffer])

  const { highlightedIds } = useScanning({
    enabled: activeUser?.accessMethod === 'scanning',
    groups: scanGroups,
    resetKey: symbols ? 'symbols' : 'letters',
    mode: activeUser?.scanMode ?? 'auto',
    pattern: activeUser?.scanPattern ?? 'row-column',
    speed: activeUser?.scanSpeed ?? 1500,
    auditory: activeUser?.scanAuditory ?? false,
  })

  return (
    <View
      style={[
        styles.keyboard,
        { backgroundColor: theme.chrome, borderTopColor: theme.chromeBorder },
      ]}
    >
      <Text
        style={[styles.buffer, { color: theme.text }]}
        accessibilityLiveRegion="polite"
      >
        {buffer || ' '}
      </Text>

      <PredictionBar
        predictions={predictions}
        onSelect={selectPrediction}
        highlightedIds={highlightedIds}
      />

      {rows.map((row, index) => (
        <View key={row} style={styles.row}>
          {index === 2 && !symbols && (
            <Key
              label="⇧"
              scanId="key-shift"
              highlightedIds={highlightedIds}
              onPress={() => setShift((s) => !s)}
              active={shift}
              wide
            />
          )}
          {row.split('').map((key) => (
            <Key
              key={key}
              label={shift && !symbols ? key.toUpperCase() : key}
              scanId={`key-${key}`}
              highlightedIds={highlightedIds}
              onPress={() => typeKey(key)}
            />
          ))}
          {index === 2 && (
            <Key
              label="⌫"
              scanId="key-backspace"
              highlightedIds={highlightedIds}
              onPress={backspace}
              wide
            />
          )}
        </View>
      ))}

      <View style={styles.row}>
        <Key
          label={symbols ? 'ABC' : '?123'}
          scanId="key-mode"
          highlightedIds={highlightedIds}
          onPress={() => setSymbols((s) => !s)}
          wide
        />
        <Key
          label={t('keyboard.space')}
          scanId="key-space"
          highlightedIds={highlightedIds}
          onPress={commit}
          space
        />
        <Key
          label="."
          scanId="key-period"
          highlightedIds={highlightedIds}
          onPress={() => punctuate('.')}
        />
        <Key
          label="?"
          scanId="key-question"
          highlightedIds={highlightedIds}
          onPress={() => punctuate('?')}
        />
        <Key
          label={t('keyboard.speak')}
          scanId="key-speak"
          highlightedIds={highlightedIds}
          onPress={speak}
          speak
        />
        <Key
          label={t('keyboard.done')}
          scanId="key-close"
          highlightedIds={highlightedIds}
          onPress={onClose}
          wide
        />
      </View>
    </View>
  )
}

function Key({
  label,
  onPress,
  scanId,
  highlightedIds,
  wide,
  space,
  speak,
  active,
}: {
  label: string
  onPress: () => void
  scanId?: string
  highlightedIds?: Set<string>
  wide?: boolean
  space?: boolean
  speak?: boolean
  active?: boolean
}) {
  const theme = useTheme()
  const t = useT()
  const highlighted = scanId ? (highlightedIds?.has(scanId) ?? false) : false
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === '⌫' ? 'Backspace key' : `${label} key`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        wide && styles.keyWide,
        space && styles.keySpace,
        speak && styles.keySpeak, // green stays
        active && styles.keyActive,
        highlighted && styles.keyScanned,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.keyText,
          { color: theme.text },
          speak && styles.keySpeakText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  keyboard: {
    backgroundColor: '#ECEFF1',
    padding: 6,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.barBorder,
  },
  buffer: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    textAlign: 'center',
    minHeight: 28,
    color: '#333333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  key: {
    minWidth: 44,
    minHeight: 48,
    flexGrow: 1,
    flexBasis: 0,
    maxWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: UI_COLORS.buttonBorder,
  },
  keyWide: {
    maxWidth: 110,
    flexGrow: 1.4,
  },
  keySpace: {
    maxWidth: 420,
    flexGrow: 6,
  },
  keySpeak: {
    backgroundColor: UI_COLORS.speakGreen,
    borderColor: UI_COLORS.speakGreen,
    maxWidth: 140,
    flexGrow: 2,
  },
  keySpeakText: {
    color: '#FFFFFF',
  },
  keyActive: {
    backgroundColor: '#BBDEFB',
  },
  // §AM-05: high-visibility scan cursor, matching the grid and message bar
  keyScanned: {
    borderWidth: 4,
    borderColor: '#1565C0',
  },
  keyText: {
    fontFamily: FONTS.bold,
    fontSize: 17,
  },
  pressed: {
    opacity: 0.6,
  },
})
