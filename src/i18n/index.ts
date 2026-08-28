import { EN, type StringKey } from './en'
import { ES } from './es'
import { PL } from './pl'
import { PT } from './pt'

// §19.7 localisation. Pure module — no store imports, so services and the
// seed generator can translate without pulling React state in. The hook that
// binds this to the active profile lives in `src/hooks/useT.ts`.

export type LanguageCode = 'en' | 'es' | 'pl' | 'pt'

export interface LanguageOption {
  code: LanguageCode
  /** Endonym — a language picker reads in the language it offers. */
  label: string
  /** Default BCP-47 tag written to `UserProfile.language`. */
  bcp47: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', bcp47: 'en-US' },
  { code: 'es', label: 'Español', bcp47: 'es-ES' },
  { code: 'pl', label: 'Polski', bcp47: 'pl-PL' },
  { code: 'pt', label: 'Português', bcp47: 'pt-BR' },
]

export const DEFAULT_LANGUAGE: LanguageCode = 'en'

const TABLES: Record<LanguageCode, Record<StringKey, string>> = { en: EN, es: ES, pl: PL, pt: PT }

/**
 * BCP-47 tag → supported language code. Anything unrecognised falls back to
 * English rather than throwing: a profile restored from a backup written by a
 * future version must still open.
 */
export function langCode(language: string | undefined): LanguageCode {
  const prefix = (language ?? DEFAULT_LANGUAGE).slice(0, 2).toLowerCase()
  const known = SUPPORTED_LANGUAGES.find((l) => l.code === prefix)
  return known ? known.code : DEFAULT_LANGUAGE
}

export function isSupportedLanguage(language: string | undefined): boolean {
  const prefix = (language ?? '').slice(0, 2).toLowerCase()
  return SUPPORTED_LANGUAGES.some((l) => l.code === prefix)
}

/**
 * Look up a string and substitute `{name}` placeholders. A missing key falls
 * back to English and then to the key itself — a wrong label is recoverable,
 * a crash on a communication device is not.
 */
export function translate(
  key: StringKey,
  language: string | undefined,
  params?: Record<string, string | number>,
): string {
  const table = TABLES[langCode(language)]
  const template = table[key] ?? EN[key] ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

export type { StringKey }
