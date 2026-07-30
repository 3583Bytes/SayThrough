import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { UI_COLORS } from '../../constants/colors'
import { FONTS } from '../../constants/typography'
import { useTheme } from '../../hooks/useTheme'
import { useMessageStore } from '../../stores/messageStore'

// §5.5 v1.0 basic keyboard: QWERTY, typed text becomes a message-bar
// token on space/period/Speak. Prediction bar and alternate layouts
// arrive in v1.1 (§18). This is the escape hatch for any word without
// a button.
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

export function KeyboardView() {
  const theme = useTheme()
  const [buffer, setBuffer] = useState('')
  const [shift, setShift] = useState(false)
  const appendToken = useMessageStore((s) => s.appendToken)
  const deleteLastToken = useMessageStore((s) => s.deleteLastToken)
  const speakMessage = useMessageStore((s) => s.speakMessage)

  const commit = () => {
    const word = buffer.trim()
    if (word) appendToken(word)
    setBuffer('')
  }

  const typeKey = (key: string) => {
    setBuffer((b) => b + (shift ? key.toUpperCase() : key))
    setShift(false)
  }

  const backspace = () => {
    if (buffer) setBuffer((b) => b.slice(0, -1))
    else deleteLastToken()
  }

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
      {ROWS.map((row, index) => (
        <View key={row} style={styles.row}>
          {index === 2 && (
            <Key label="⇧" onPress={() => setShift((s) => !s)} active={shift} wide />
          )}
          {row.split('').map((key) => (
            <Key
              key={key}
              label={shift ? key.toUpperCase() : key}
              onPress={() => typeKey(key)}
            />
          ))}
          {index === 2 && <Key label="⌫" onPress={backspace} wide />}
        </View>
      ))}
      <View style={styles.row}>
        <Key label="space" onPress={commit} space />
        <Key label="." onPress={commit} />
        <Key
          label="▶ Speak"
          onPress={() => {
            commit()
            speakMessage()
          }}
          speak
        />
      </View>
    </View>
  )
}

function Key({
  label,
  onPress,
  wide,
  space,
  speak,
  active,
}: {
  label: string
  onPress: () => void
  wide?: boolean
  space?: boolean
  speak?: boolean
  active?: boolean
}) {
  const theme = useTheme()
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
  keyText: {
    fontFamily: FONTS.bold,
    fontSize: 17,
  },
  pressed: {
    opacity: 0.6,
  },
})
