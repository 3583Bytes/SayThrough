import { MaterialIcons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LAYOUT } from '../../constants/layout'
import { FONTS } from '../../constants/typography'
import { useTheme } from '../../hooks/useTheme'
import { useT } from '../../hooks/useT'
import { useNavigationStore } from '../../stores/navigationStore'

interface TopBarProps {
  pageName: string
  editHidden?: boolean // guest sessions: nothing may be saved
  onEditPress: () => void // PIN-gated by the caller (§13.1)
  onSearchPress: () => void // §12.4
  filter?: {
    available: boolean // user has a word list selected
    enabled: boolean
    onToggle: () => void
  }
}

// §5.3 top bar — home/search left, filter/edit right. Page-to-page Back
// lives in the grid itself now (a real button in the vocabulary), so the
// chrome only carries Home + Search.
export function TopBar({
  pageName,
  editHidden,
  onEditPress,
  onSearchPress,
  filter,
}: TopBarProps) {
  const theme = useTheme()
  const t = useT()
  const navigateHome = useNavigationStore((s) => s.navigateHome)

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: theme.chrome, borderBottomColor: theme.chromeBorder },
      ]}
    >
      <View style={styles.side}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('nav.home')}
          onPress={navigateHome}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <MaterialIcons name="home" size={22} color={theme.icon} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('nav.search')}
          onPress={onSearchPress}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <MaterialIcons name="search" size={22} color={theme.icon} />
        </Pressable>
      </View>
      <Text style={[styles.pageName, { color: theme.text }]}>{pageName}</Text>
      <View style={[styles.side, styles.right]}>
        {filter?.available && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              filter.enabled ? 'Disable vocabulary filter' : 'Enable vocabulary filter'
            }
            onPress={filter.onToggle}
            style={({ pressed }) => [
              styles.iconButton,
              filter.enabled && styles.filterActive,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons
              name="block"
              size={22}
              color={filter.enabled ? '#E65100' : theme.icon}
            />
          </Pressable>
        )}
        {!editHidden && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nav.editMode')}
            onPress={onEditPress}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <MaterialIcons name="settings" size={22} color={theme.icon} />
          </Pressable>
        )}
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
    borderBottomWidth: 1,
    paddingHorizontal: 4,
  },
  side: {
    flexDirection: 'row',
    minWidth: 140,
  },
  right: {
    justifyContent: 'flex-end',
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterActive: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.6,
  },
  pageName: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '600',
    color: '#555555',
  },
})
