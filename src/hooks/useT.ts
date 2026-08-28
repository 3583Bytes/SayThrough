import { useCallback } from 'react'
import { type StringKey, translate } from '../i18n'
import { useUserStore } from '../stores/userStore'

/**
 * Translator bound to the active profile's language. Subscribing to the
 * language field alone means a component re-renders when the language
 * changes but not on every unrelated profile edit.
 */
export function useT(): (key: StringKey, params?: Record<string, string | number>) => string {
  const language = useUserStore((s) => s.activeUser?.language)
  return useCallback(
    (key: StringKey, params?: Record<string, string | number>) =>
      translate(key, language, params),
    [language],
  )
}

/** The active profile's raw BCP-47 tag — for anything that needs the tag itself. */
export function useLanguage(): string | undefined {
  return useUserStore((s) => s.activeUser?.language)
}
