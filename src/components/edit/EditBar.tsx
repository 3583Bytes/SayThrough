import { Pressable, StyleSheet, Text, View } from 'react-native'
import { UI_COLORS } from '../../constants/colors'
import { LAYOUT } from '../../constants/layout'

interface EditBarProps {
  pageName: string
  onDone: () => void
  onSettings: () => void // §5.8: settings are reachable via edit mode only
}

// §5.6 — replaces the top bar while editing; changes save immediately,
// Done just exits
export function EditBar({ pageName, onDone, onSettings }: EditBarProps) {
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Done editing"
        onPress={onDone}
        style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
      >
        <Text style={styles.doneText}>✓ Done</Text>
      </Pressable>
      <Text style={styles.title}>Editing: {pageName}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        onPress={onSettings}
        style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
      >
        <Text style={styles.settingsText}>⚙ Settings</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    height: LAYOUT.topBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF3E0',
    borderBottomWidth: 1,
    borderBottomColor: '#FFB74D',
    paddingHorizontal: 8,
  },
  doneButton: {
    minHeight: 36,
    justifyContent: 'center',
    backgroundColor: UI_COLORS.speakGreen,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  doneText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7A4F01',
  },
  settingsButton: {
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
    paddingHorizontal: 12,
  },
  settingsText: {
    color: '#7A4F01',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
})
