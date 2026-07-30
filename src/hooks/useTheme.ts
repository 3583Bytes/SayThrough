import { useColorScheme } from 'react-native'
import { LIGHT, THEMES, type Theme } from '../constants/themes'
import { useUserStore } from '../stores/userStore'

// Resolves the active theme from the profile preference ('light' |
// 'dark' | 'system') and the OS color scheme. Pre-profile screens
// (loading, onboarding welcome) fall back to the system scheme.
export function useTheme(): Theme {
  const pref = useUserStore((s) => s.activeUser?.theme) ?? 'system'
  const system = useColorScheme() // 'light' | 'dark' | null (reactive on web)
  const mode: 'light' | 'dark' =
    pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref
  return THEMES[mode] ?? LIGHT
}
