import { EN } from '../../src/i18n/en'
import { ES } from '../../src/i18n/es'
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  langCode,
  translate,
} from '../../src/i18n'

// §19.7 localisation. Completeness is enforced by the type system (ES is typed
// as Record<StringKey, string>), so what is worth testing here is the things
// types cannot catch: an untranslated string left as its English source, and a
// placeholder that exists in one language but not the other — which would
// silently render `{name}` on someone's screen.

const KEYS = Object.keys(EN) as Array<keyof typeof EN>
const placeholders = (s: string) =>
  [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('language codes', () => {
  it('maps BCP-47 tags to supported codes', () => {
    expect(langCode('es-ES')).toBe('es')
    expect(langCode('es-MX')).toBe('es')
    expect(langCode('en-GB')).toBe('en')
  })

  it('falls back to English rather than throwing on anything unknown', () => {
    // A profile restored from a backup written by a future version must open.
    expect(langCode('fr-FR')).toBe(DEFAULT_LANGUAGE)
    expect(langCode(undefined)).toBe(DEFAULT_LANGUAGE)
    expect(langCode('')).toBe(DEFAULT_LANGUAGE)
    expect(isSupportedLanguage('fr-FR')).toBe(false)
    expect(isSupportedLanguage('es')).toBe(true)
  })

  it('offers each language under its own name', () => {
    // A picker that says "Spanish" is no use to someone who reads Spanish.
    expect(SUPPORTED_LANGUAGES.map((l) => l.label)).toEqual(['English', 'Español'])
  })
})

describe('string tables', () => {
  it('translates every key', () => {
    expect(Object.keys(ES).sort()).toEqual(KEYS.slice().sort())
  })

  it('uses the same placeholders in both languages', () => {
    for (const key of KEYS) {
      expect({ key, params: placeholders(ES[key]) }).toEqual({
        key,
        params: placeholders(EN[key]),
      })
    }
  })

  it('leaves no Spanish string identical to its English source', () => {
    // Proper nouns, file extensions and true cognates legitimately match —
    // `color` and `normal` ARE the Spanish words, and translating them to
    // something else to satisfy this test would make the app worse.
    const shared = new Set([
      'app.name', 'settings.importObz', 'settings.emergencyPhrase',
      'preset.normal', 'pin.confirmPlaceholder', 'settings.title',
      'edit.color', 'edit.colorSwatch', 'settings.gapNormal',
    ])
    const untranslated = KEYS.filter(
      (key) => !shared.has(key) && ES[key] === EN[key],
    )
    expect(untranslated).toEqual([])
  })

  it('has no empty strings', () => {
    for (const key of KEYS) {
      expect(EN[key].trim()).not.toBe('')
      expect(ES[key].trim()).not.toBe('')
    }
  })
})

describe('translate', () => {
  it('returns the requested language', () => {
    expect(translate('common.done', 'en-US')).toBe('Done')
    expect(translate('common.done', 'es-ES')).toBe('Listo')
  })

  it('substitutes placeholders', () => {
    expect(translate('forms.title', 'en-US', { word: 'run' })).toBe('Forms of “run”')
    expect(translate('forms.title', 'es-ES', { word: 'correr' })).toBe(
      'Formas de «correr»',
    )
  })

  it('leaves an unsupplied placeholder visible rather than printing undefined', () => {
    expect(translate('forms.title', 'en-US', {})).toContain('{word}')
  })

  it('falls back to English for an unsupported language', () => {
    expect(translate('common.done', 'fr-FR')).toBe('Done')
  })
})
