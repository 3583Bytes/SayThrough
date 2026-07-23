import { MaterialIcons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { UI_COLORS } from '../../constants/colors'
import { LAYOUT } from '../../constants/layout'
import { FONTS } from '../../constants/typography'

interface ToolbarProps {
  isKeyboardOpen: boolean
  onCore: () => void
  onQuick: () => void
  onKeyboard: () => void
}

// §5.3 toolbar — Core / Quick / Keys for v1.0; Topics is covered by the
// home page's navigation buttons, Forms arrives in v1.1
export function Toolbar({ isKeyboardOpen, onCore, onQuick, onKeyboard }: ToolbarProps) {
  const items: Array<
    [keyof typeof MaterialIcons.glyphMap, string, () => void, boolean]
  > = [
    ['apps', 'Core', onCore, false],
    ['bolt', 'Quick', onQuick, false],
    ['keyboard', 'Keys', onKeyboard, isKeyboardOpen],
  ]
  return (
    <View style={styles.bar}>
      {items.map(([icon, label, onPress, active]) => (
        <Pressable
          key={label}
          accessibilityRole="button"
          accessibilityLabel={`${label} section`}
          onPress={onPress}
          style={({ pressed }) => [
            styles.item,
            active && styles.itemActive,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name={icon} size={20} color={active ? "#1976D2" : "#666666"} />
          <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    height: LAYOUT.toolbarHeight,
    flexDirection: 'row',
    backgroundColor: UI_COLORS.barBackground,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.barBorder,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActive: {
    borderTopWidth: 2,
    borderTopColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
  },
  labelActive: {
    color: '#1976D2',
  },
  pressed: {
    opacity: 0.6,
  },
})
