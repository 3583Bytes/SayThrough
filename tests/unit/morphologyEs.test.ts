import {
  adjectiveAgreement,
  conjugate,
  inferGender,
  pluralize,
  spanishWordForms,
} from '../../src/services/morphology.es'
import { wordForms } from '../../src/services/morphology'

// §19.7 Spanish word forms. The English engine is covered by morphology.test.ts;
// this file covers what Spanish does that English does not — person marking on
// the verb, and gender/number agreement between an adjective and its noun.

const values = (forms: Array<{ value: string }>) => forms.map((f) => f.value)

describe('pluralize', () => {
  it('adds -s after a vowel and -es after a consonant', () => {
    expect(pluralize('casa')).toBe('casas')
    expect(pluralize('coche')).toBe('coches')
    expect(pluralize('papel')).toBe('papeles')
    expect(pluralize('reloj')).toBe('relojes')
  })

  it('turns a final -z into -ces', () => {
    expect(pluralize('lápiz')).toBe('lápices')
    expect(pluralize('feliz')).toBe('felices')
    expect(pluralize('luz')).toBe('luces')
  })

  it('drops the written accent when a syllable is added', () => {
    expect(pluralize('canción')).toBe('canciones')
    expect(pluralize('ratón')).toBe('ratones')
    expect(pluralize('inglés')).toBe('ingleses')
  })

  it('leaves invariable words alone', () => {
    expect(pluralize('lunes')).toBe('lunes')
    expect(pluralize('paraguas')).toBe('paraguas')
  })
})

describe('inferGender', () => {
  it('reads the regular endings', () => {
    expect(inferGender('mesa')).toBe('f')
    expect(inferGender('libro')).toBe('m')
    expect(inferGender('canción')).toBe('f')
    expect(inferGender('ciudad')).toBe('f')
  })

  it('knows the everyday exceptions', () => {
    // -a but masculine
    expect(inferGender('día')).toBe('m')
    expect(inferGender('problema')).toBe('m')
    // -o but feminine
    expect(inferGender('mano')).toBe('f')
    expect(inferGender('foto')).toBe('f')
    // takes `el` for phonetic reasons but agrees feminine: "el agua fría"
    expect(inferGender('agua')).toBe('f')
  })
})

describe('adjectiveAgreement', () => {
  it('gives -o adjectives all four forms', () => {
    expect(adjectiveAgreement('rojo')).toEqual({
      ms: 'rojo', fs: 'roja', mp: 'rojos', fp: 'rojas',
    })
  })

  it('marks number only on adjectives that do not mark gender', () => {
    expect(adjectiveAgreement('grande')).toEqual({
      ms: 'grande', fs: 'grande', mp: 'grandes', fp: 'grandes',
    })
    expect(adjectiveAgreement('feliz')).toEqual({
      ms: 'feliz', fs: 'feliz', mp: 'felices', fp: 'felices',
    })
  })

  it('adds -a to -or, -ón and -és adjectives', () => {
    expect(adjectiveAgreement('trabajador').fs).toBe('trabajadora')
    expect(adjectiveAgreement('llorón').fs).toBe('llorona')
    expect(adjectiveAgreement('inglés').fs).toBe('inglesa')
  })

  it('leaves the comparatives invariable in gender', () => {
    // mejor/peor/mayor/menor look like -or adjectives but never take -a
    expect(adjectiveAgreement('mejor')).toEqual({
      ms: 'mejor', fs: 'mejor', mp: 'mejores', fp: 'mejores',
    })
  })
})

describe('conjugate', () => {
  it('handles the three regular classes', () => {
    expect(conjugate('hablar')).toMatchObject({
      yo: 'hablo', tu: 'hablas', el: 'habla',
      nosotros: 'hablamos', ellos: 'hablan',
      pasado: 'hablé', gerundio: 'hablando',
    })
    expect(conjugate('comer')).toMatchObject({ yo: 'como', el: 'come', gerundio: 'comiendo' })
    expect(conjugate('vivir')).toMatchObject({ yo: 'vivo', nosotros: 'vivimos' })
  })

  it('knows the high-frequency irregulars', () => {
    expect(conjugate('ser')?.yo).toBe('soy')
    expect(conjugate('estar')?.yo).toBe('estoy')
    expect(conjugate('ir')?.yo).toBe('voy')
    expect(conjugate('tener')?.yo).toBe('tengo')
    expect(conjugate('querer')?.el).toBe('quiere')
  })

  it('returns null for something that is not an infinitive', () => {
    expect(conjugate('más')).toBeNull()
    expect(conjugate('casa')).toBeNull()
  })
})

describe('spanishWordForms', () => {
  it('offers a verb its person forms — the point of a pro-drop language', () => {
    const forms = spanishWordForms('comer', 'verb')
    expect(values(forms)).toEqual(
      expect.arrayContaining(['comer', 'como', 'comes', 'come', 'comemos', 'comen']),
    )
    // The person is what the hint names, because that is what distinguishes them
    expect(forms.find((f) => f.value === 'como')?.hint).toBe('yo')
  })

  it('gives nouns a plural and `de` rather than an English possessive', () => {
    const forms = spanishWordForms('mamá', 'noun')
    expect(values(forms)).toContain('mamás')
    expect(values(forms)).toContain('de mamá')
    expect(values(forms).some((v) => v.includes("'s"))).toBe(false)
  })

  it('picks the article that matches the noun', () => {
    expect(values(spanishWordForms('casa', 'noun'))).toContain('la casa')
    expect(values(spanishWordForms('libro', 'noun'))).toContain('el libro')
  })

  it('inflects determiners, which English treats as invariable', () => {
    expect(values(spanishWordForms('el', 'little'))).toEqual(['el', 'la', 'los', 'las'])
    expect(values(spanishWordForms('un', 'little'))).toEqual(['un', 'una', 'unos', 'unas'])
    // A preposition still has nothing to offer, so the popup stays shut
    expect(spanishWordForms('con', 'little')).toHaveLength(1)
  })

  it('returns a single form for words that do not inflect', () => {
    expect(spanishWordForms('hola', 'social')).toHaveLength(1)
    expect(spanishWordForms('por favor', 'social')).toHaveLength(1)
    expect(spanishWordForms('dónde', 'question')).toHaveLength(1)
  })
})

// The behaviour that makes Spanish structurally different from English: a
// form is correct relative to ANOTHER word, so the engine has to see the
// message bar.
describe('agreement with the message bar', () => {
  it('leads with the form matching a feminine singular noun', () => {
    const forms = spanishWordForms('rojo', 'descriptor', { precedingWords: ['la', 'casa'] })
    expect(forms[0].value).toBe('roja')
    expect(forms[0].hint).toBe('concuerda')
  })

  it('leads with the masculine plural after a masculine plural noun', () => {
    const forms = spanishWordForms('rojo', 'descriptor', { precedingWords: ['los', 'libros'] })
    expect(forms[0].value).toBe('rojos')
  })

  it('agrees with a feminine noun whose ending says otherwise', () => {
    // "la mano" is feminine despite the -o, so the adjective must be too
    const forms = spanishWordForms('limpio', 'descriptor', { precedingWords: ['mano'] })
    expect(forms[0].value).toBe('limpia')
  })

  it('ignores determiners and function words when looking for the noun', () => {
    const forms = spanishWordForms('pequeño', 'descriptor', {
      precedingWords: ['quiero', 'la', 'pelota'],
    })
    expect(forms[0].value).toBe('pequeña')
  })

  it('falls back to the citation form when there is no noun to agree with', () => {
    const forms = spanishWordForms('rojo', 'descriptor', { precedingWords: [] })
    expect(forms[0].value).toBe('rojo')
    expect(forms[0].hint).toBe('masculino')
  })

  it('still offers every other form, not just the agreeing one', () => {
    const forms = spanishWordForms('rojo', 'descriptor', { precedingWords: ['casa'] })
    expect(values(forms)).toEqual(
      expect.arrayContaining(['roja', 'rojo', 'rojos', 'rojas', 'más rojo']),
    )
  })
})

describe('language dispatch', () => {
  it('routes by BCP-47 tag', () => {
    expect(values(wordForms('comer', 'verb', 'es-ES'))).toContain('como')
    expect(values(wordForms('eat', 'verb', 'en-US'))).toContain('ate')
  })

  it('defaults to English for an unknown or missing language', () => {
    expect(values(wordForms('eat', 'verb'))).toContain('ate')
    expect(values(wordForms('eat', 'verb', 'fr-FR'))).toContain('ate')
  })

  it('never returns duplicate forms', () => {
    for (const word of ['grande', 'feliz', 'ser', 'lunes', 'mano']) {
      const forms = values(spanishWordForms(word, 'descriptor'))
      expect(new Set(forms).size).toBe(forms.length)
    }
  })
})
