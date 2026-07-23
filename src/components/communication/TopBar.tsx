import { Pressable, StyleSheet, Text, View } from 'react-native'
import { UI_COLORS } from '../../constants/colors'
import { LAYOUT } from '../../constants/layout'
import { useNavigationStore } from '../../stores/navigationStore'

interface TopBarProps {
  pageName: string
  onEditPress: () => void // PIN-gated by the caller (§13.1)
  onSearchPress: () => void // §12.4
  filter?: {
    available: boolean // user has a word list selected
    enabled: boolean
    onToggle: () => void
  }
}

// §5.3 top bar — back/home/search left, filter/edit right
export function TopBar({ pageName, onEditPress, onSearchPress, filter }: TopBarProps) {
  const canGoBack = useNavigationStore((s) => s.pageHistory.length > 0)
  const navigateBack = useNavigationStore((s) => s.navigateBack)
  const navigateHome = useNavigationStore((s) => s.navigateHome)

  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          disabled={!canGoBack}
          onPress={navigateBack}
          style={({ pressed }) => [
            styles.iconButton,
            !canGoBack && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.icon}>←</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Home"
          onPress={navigateHome}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Text style={styles.icon}>⌂</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search vocabulary"
          onPress={onSearchPress}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Text style={styles.icon}>🔍</Text>
        </Pressable>
      </View>
      <Text style={styles.pageName}>{pageName}</Text>
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
            <Text style={[styles.icon, filter.enabled && styles.filterActiveIcon]}>⊘</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit mode"
          onPress={onEditPress}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Text style={styles.icon}>⚙</Text>
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
    backgroundColor: UI_COLORS.barBackground,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.barBorder,
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
  icon: {
    fontSize: 20,
  },
  filterActive: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  filterActiveIcon: {
    color: '#E65100',
  },
  disabled: {
    opacity: 0.3,
  },
  pressed: {
    opacity: 0.6,
  },
  pageName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555555',
  },
})
