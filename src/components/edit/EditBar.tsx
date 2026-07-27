import { MaterialIcons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { UI_COLORS } from '../../constants/colors'
import { LAYOUT } from '../../constants/layout'
import { FONTS } from '../../constants/typography'

interface EditBarProps {
  pageName: string
  wordListName?: string // §12.2: selecting words for this list
  onDone: () => void
  onPageMenu: () => void // rename/delete the current page
  onSettings: () => void // §5.8: settings are reachable via edit mode only
}

// §5.6 — replaces the top bar while editing; changes save immediately,
// Done just exits
export function EditBar({
  pageName,
  wordListName,
  onDone,
  onPageMenu,
  onSettings,
}: EditBarProps) {
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Done editing"
        onPress={onDone}
        style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
      >
        <View style={styles.buttonRow}>
          <MaterialIcons name="check" size={18} color="#FFFFFF" />
          <Text style={styles.doneText}>Done</Text>
        </View>
      </Pressable>
      <Text style={styles.title}>
        {wordListName
          ? `Tap words for list: ${wordListName}`
          : `Editing: ${pageName}`}
      </Text>
      <View style={styles.rightGroup}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Page options"
          onPress={onPageMenu}
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
        >
          <View style={styles.buttonRow}>
            <MaterialIcons name="description" size={16} color="#7A4F01" />
            <Text style={styles.settingsText}>Page…</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={onSettings}
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
        >
          <View style={styles.buttonRow}>
            <MaterialIcons name="settings" size={16} color="#7A4F01" />
            <Text style={styles.settingsText}>Settings</Text>
          </View>
        </Pressable>
      </View>
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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doneText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#7A4F01',
  },
  rightGroup: {
    flexDirection: 'row',
    gap: 6,
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
    fontFamily: FONTS.bold,
  },
  pressed: {
    opacity: 0.7,
  },
})
