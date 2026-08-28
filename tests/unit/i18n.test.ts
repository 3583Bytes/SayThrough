import { EN } from '../../src/i18n/en'
import { ES } from '../../src/i18n/es'
import { PL } from '../../src/i18n/pl'
import { PT } from '../../src/i18n/pt'
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
    expect(langCode('pl-PL')).toBe('pl')
    expect(langCode('pl')).toBe('pl')
    expect(langCode('pt-BR')).toBe('pt')
    expect(langCode('pt-PT')).toBe('pt')
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
    expect(SUPPORTED_LANGUAGES.map((l) => l.label)).toEqual([
      'English', 'Español', 'Polski', 'Português',
    ])
  })
})

const TRANSLATIONS: Array<[string, Record<string, string>]> = [
  ['es', ES],
  ['pl', PL],
  ['pt', PT],
]

describe('string tables', () => {
  it.each(TRANSLATIONS)('%s translates every key', (_code, table) => {
    expect(Object.keys(table).sort()).toEqual(KEYS.slice().sort())
  })

  it.each(TRANSLATIONS)('%s uses the same placeholders as English', (code, table) => {
    for (const key of KEYS) {
      expect({ code, key, params: placeholders(table[key]) }).toEqual({
        code,
        key,
        params: placeholders(EN[key]),
      })
    }
  })

  it.each(TRANSLATIONS)('%s has no empty strings', (_code, table) => {
    for (const key of KEYS) expect(table[key].trim()).not.toBe('')
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

  it('leaves no Polish string identical to its English source', () => {
    // Polish shares far less with English than Spanish does, so the list of
    // legitimate matches is shorter: a product name, a file extension, and
    // the two international words.
    // `symbol` is the Polish word too.
    const shared = new Set([
      'app.name', 'settings.importObz', 'preset.normal', 'pin.newPlaceholder',
      'edit.symbol', 'edit.symbolResult',
    ])
    const untranslated = KEYS.filter((key) => !shared.has(key) && PL[key] === EN[key])
    expect(untranslated).toEqual([])
  })

  it('leaves no Portuguese string identical to its English source', () => {
    // Portuguese shares Latin roots with English, so the cognate list is the
    // longest of the three — but each of these really is the Portuguese word.
    const shared = new Set([
      'app.name', 'settings.importObz', 'preset.normal', 'edit.symbol',
      'edit.symbolResult', 'edit.color', 'edit.colorSwatch', 'nav.section',
      'nav.sectionCurrent', 'settings.gapNormal',
    ])
    const untranslated = KEYS.filter((key) => !shared.has(key) && PT[key] === EN[key])
    expect(untranslated).toEqual([])
  })

  it('has no empty English strings', () => {
    for (const key of KEYS) expect(EN[key].trim()).not.toBe('')
  })
})

describe('translate', () => {
  it('returns the requested language', () => {
    expect(translate('common.done', 'en-US')).toBe('Done')
    expect(translate('common.done', 'es-ES')).toBe('Listo')
    expect(translate('common.done', 'pl-PL')).toBe('Gotowe')
    expect(translate('common.done', 'pt-BR')).toBe('Pronto')
  })

  it('substitutes placeholders', () => {
    expect(translate('forms.title', 'en-US', { word: 'run' })).toBe('Forms of “run”')
    expect(translate('forms.title', 'es-ES', { word: 'correr' })).toBe(
      'Formas de «correr»',
    )
    expect(translate('forms.title', 'pl-PL', { word: 'biegać' })).toBe(
      'Formy słowa „biegać”',
    )
  })

  it('leaves an unsupplied placeholder visible rather than printing undefined', () => {
    expect(translate('forms.title', 'en-US', {})).toContain('{word}')
  })

  it('falls back to English for an unsupported language', () => {
    expect(translate('common.done', 'fr-FR')).toBe('Done')
  })
})
