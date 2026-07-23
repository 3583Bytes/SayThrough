import { Pressable, StyleSheet, Text, View } from 'react-native'
import { UI_COLORS } from '../../constants/colors'
import { LAYOUT } from '../../constants/layout'

interface ToolbarProps {
  isKeyboardOpen: boolean
  onCore: () => void
  onQuick: () => void
  onKeyboard: () => void
}

// §5.3 toolbar — Core / Quick / Keys for v1.0; Topics is covered by the
// home page's navigation buttons, Forms arrives in v1.1
export function Toolbar({ isKeyboardOpen, onCore, onQuick, onKeyboard }: ToolbarProps) {
  const items: Array<[string, string, () => void, boolean]> = [
    ['⌂', 'Core', onCore, false],
    ['⚡', 'Quick', onQuick, false],
    ['⌨', 'Keys', onKeyboard, isKeyboardOpen],
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
          <Text style={styles.icon}>{icon}</Text>
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
  icon: {
    fontSize: 18,
  },
  label: {
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
