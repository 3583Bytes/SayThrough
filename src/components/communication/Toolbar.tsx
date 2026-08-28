import { MaterialIcons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { UI_COLORS } from '../../constants/colors'
import { LAYOUT } from '../../constants/layout'
import { FONTS } from '../../constants/typography'
import { useTheme } from '../../hooks/useTheme'
import { useT } from '../../hooks/useT'

export type ToolbarSection = 'core' | 'quick' | 'keyboard' | null

interface ToolbarProps {
  activeSection: ToolbarSection // which section you're currently in ("you are here")
  onCore: () => void
  onQuick: () => void
  onKeyboard: () => void
}

// §5.3 toolbar — Core / Quick / Keys for v1.0; Topics is covered by the
// home page's navigation buttons, Forms arrives in v1.1
export function Toolbar({ activeSection, onCore, onQuick, onKeyboard }: ToolbarProps) {
  const theme = useTheme()
  const t = useT()
  const items: Array<
    [keyof typeof MaterialIcons.glyphMap, string, () => void, ToolbarSection]
  > = [
    ['apps', t('toolbar.core'), onCore, 'core'],
    ['bolt', t('toolbar.quick'), onQuick, 'quick'],
    ['keyboard', t('toolbar.keys'), onKeyboard, 'keyboard'],
  ]
  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: theme.chrome, borderTopColor: theme.chromeBorder },
      ]}
    >
      {items.map(([icon, label, onPress, section]) => {
        const active = section === activeSection
        return (
        <Pressable
          key={label}
          accessibilityRole="button"
          accessibilityLabel={
            active ? t('nav.sectionCurrent', { label }) : t('nav.section', { label })
          }
          onPress={onPress}
          style={({ pressed }) => [
            styles.item,
            active && styles.itemActive,
            active && { backgroundColor: theme.accentSurface, borderTopColor: theme.accent },
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name={icon} size={20} color={active ? theme.accent : theme.icon} />
          <Text
            style={[styles.label, { color: active ? theme.accent : theme.textMuted }]}
          >
            {label}
          </Text>
        </Pressable>
        )
      })}
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
