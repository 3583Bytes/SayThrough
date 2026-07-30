import { useState } from 'react'
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { UI_COLORS } from '../../constants/colors'
import { useTheme } from '../../hooks/useTheme'

interface PinEntryModalProps {
  visible: boolean
  onSubmit: (pin: string) => void
  onCancel: () => void
  error?: string
}

export function PinEntryModal({
  visible,
  onSubmit,
  onCancel,
  error,
}: PinEntryModalProps) {
  const theme = useTheme()
  const [pin, setPin] = useState('')

  const submit = () => {
    onSubmit(pin)
    setPin('')
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: theme.backdrop }]}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.text }]}>Enter caregiver PIN</Text>
          <TextInput
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            autoFocus
            style={[
              styles.input,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
            ]}
            accessibilityLabel="PIN input"
            onSubmitEditing={submit}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.buttons}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel PIN entry"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Submit PIN"
              onPress={submit}
              style={({ pressed }) => [
                styles.button,
                styles.primary,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.buttonText, styles.primaryText]}>OK</Text>
            </Pressable>
          </View>
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
    justifyContent: 'center',
  },
  card: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: UI_COLORS.buttonBorder,
    borderRadius: 8,
    padding: 10,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 8,
  },
  error: {
    color: UI_COLORS.clearRed,
    textAlign: 'center',
    fontSize: 13,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    minWidth: 80,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: UI_COLORS.barBorder,
    paddingHorizontal: 12,
  },
  primary: {
    backgroundColor: UI_COLORS.speakGreen,
    borderColor: UI_COLORS.speakGreen,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
})
