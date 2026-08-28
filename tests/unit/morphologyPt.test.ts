import {
  adjectiveAgreement,
  conjugate,
  inferGender,
  pluralize,
  portugueseWordForms,
} from '../../src/services/morphology.pt'
import { contract, hasContractions } from '../../src/services/contractions'
import { wordForms } from '../../src/services/morphology'

// §19.7 Brazilian Portuguese. Closest engine to Spanish, so the tests focus on
// what differs: the nasal and consonant-final plurals, the reduced Brazilian
// person paradigm, and the contractions — which are not morphology at all.

const values = (forms: Array<{ value: string }>) => forms.map((f) => f.value)
const hintOf = (forms: Array<{ value: string; hint: string }>, value: string) =>
  forms.find((f) => f.value === value)?.hint

describe('pluralize', () => {
  it('adds -s after a vowel', () => {
    expect(pluralize('casa')).toBe('casas')
    expect(pluralize('livro')).toBe('livros')
    expect(pluralize('café')).toBe('cafés')
  })

  it('splits -ão three ways, because no rule predicts it', () => {
    expect(pluralize('coração')).toBe('corações') // the majority
    expect(pluralize('pão')).toBe('pães')
    expect(pluralize('mão')).toBe('mãos')
    expect(pluralize('irmão')).toBe('irmãos')
  })

  it('turns -l into -is and -m into -ns', () => {
    expect(pluralize('animal')).toBe('animais')
    expect(pluralize('papel')).toBe('papéis')
    expect(pluralize('homem')).toBe('homens')
    expect(pluralize('jardim')).toBe('jardins')
  })

  it('adds -es after -r and -z', () => {
    expect(pluralize('flor')).toBe('flores')
    expect(pluralize('luz')).toBe('luzes')
    expect(pluralize('português')).toBe('portugueses')
  })

  it('leaves unstressed -s words invariable', () => {
    expect(pluralize('lápis')).toBe('lápis')
    expect(pluralize('ônibus')).toBe('ônibus')
  })
})

describe('inferGender', () => {
  it('reads the regular endings', () => {
    expect(inferGender('casa')).toBe('f')
    expect(inferGender('livro')).toBe('m')
    expect(inferGender('estação')).toBe('f')
    expect(inferGender('cidade')).toBe('f')
  })

  it('knows the everyday exceptions', () => {
    expect(inferGender('dia')).toBe('m')
    expect(inferGender('problema')).toBe('m')
    expect(inferGender('mão')).toBe('f')
    expect(inferGender('foto')).toBe('f')
    expect(inferGender('viagem')).toBe('f')
  })
})

describe('adjectiveAgreement', () => {
  it('gives -o adjectives all four forms', () => {
    expect(adjectiveAgreement('bonito')).toEqual({
      ms: 'bonito', fs: 'bonita', mp: 'bonitos', fp: 'bonitas',
    })
  })

  it('marks number only on adjectives that do not mark gender', () => {
    expect(adjectiveAgreement('grande')).toEqual({
      ms: 'grande', fs: 'grande', mp: 'grandes', fp: 'grandes',
    })
    expect(adjectiveAgreement('feliz')).toEqual({
      ms: 'feliz', fs: 'feliz', mp: 'felizes', fp: 'felizes',
    })
  })

  it('handles -or, -ês and -ão feminines', () => {
    expect(adjectiveAgreement('trabalhador').fs).toBe('trabalhadora')
    expect(adjectiveAgreement('português').fs).toBe('portuguesa')
    expect(adjectiveAgreement('alemão').fs).toBe('alemã')
  })

  it('leaves the comparatives invariable in gender', () => {
    expect(adjectiveAgreement('melhor')).toEqual({
      ms: 'melhor', fs: 'melhor', mp: 'melhores', fp: 'melhores',
    })
  })
})

describe('conjugate', () => {
  it('handles the three regular classes', () => {
    expect(conjugate('falar')).toMatchObject({
      eu: 'falo', voce: 'fala', nos: 'falamos', eles: 'falam',
      passado: 'falei', gerundio: 'falando',
    })
    expect(conjugate('comer')).toMatchObject({ eu: 'como', voce: 'come', gerundio: 'comendo' })
    expect(conjugate('partir')).toMatchObject({ eu: 'parto', nos: 'partimos', gerundio: 'partindo' })
  })

  it('knows the high-frequency irregulars', () => {
    expect(conjugate('ser')?.eu).toBe('sou')
    expect(conjugate('estar')?.eu).toBe('estou')
    expect(conjugate('ir')?.eu).toBe('vou')
    expect(conjugate('ter')?.eu).toBe('tenho')
    expect(conjugate('fazer')?.eu).toBe('faço')
  })

  it('returns null for something that is not an infinitive', () => {
    expect(conjugate('mais')).toBeNull()
    expect(conjugate('casa')).toBeNull()
  })
})

describe('portugueseWordForms', () => {
  it('collapses você and ele onto one form, as Brazilian usage does', () => {
    const forms = portugueseWordForms('comer', 'verb')
    expect(values(forms)).toEqual(
      expect.arrayContaining(['comer', 'como', 'come', 'comemos', 'comem']),
    )
    // One label for both — the paradigm a Brazilian board needs is four forms,
    // not the five Spanish offers.
    expect(hintOf(forms, 'come')).toBe('você / ele / ela')
  })

  it('gives nouns `de` rather than an English possessive', () => {
    const forms = portugueseWordForms('mamãe', 'noun')
    expect(values(forms)).toContain('de mamãe')
    expect(values(forms).some((v) => v.includes("'s"))).toBe(false)
  })

  it('picks the article that matches the noun', () => {
    expect(values(portugueseWordForms('casa', 'noun'))).toContain('a casa')
    expect(values(portugueseWordForms('livro', 'noun'))).toContain('o livro')
  })

  it('inflects determiners', () => {
    expect(values(portugueseWordForms('o', 'little'))).toEqual(['o', 'a', 'os', 'as'])
    expect(values(portugueseWordForms('um', 'little'))).toEqual(['um', 'uma', 'uns', 'umas'])
  })

  it('returns a single form for words that do not inflect', () => {
    expect(portugueseWordForms('oi', 'social')).toHaveLength(1)
    expect(portugueseWordForms('onde', 'question')).toHaveLength(1)
  })
})

describe('adjective agreement with the message bar', () => {
  it('leads with the form matching a feminine noun', () => {
    const forms = portugueseWordForms('bonito', 'descriptor', { precedingWords: ['a', 'casa'] })
    expect(forms[0].value).toBe('bonita')
    expect(forms[0].hint).toBe('concorda')
  })

  it('leads with the masculine plural after a masculine plural noun', () => {
    const forms = portugueseWordForms('bonito', 'descriptor', { precedingWords: ['livros'] })
    expect(forms[0].value).toBe('bonitos')
  })

  it('agrees with a feminine noun whose ending says otherwise', () => {
    const forms = portugueseWordForms('limpo', 'descriptor', { precedingWords: ['mão'] })
    expect(forms[0].value).toBe('limpa')
  })

  it('falls back to the citation form with nothing to agree with', () => {
    const forms = portugueseWordForms('bonito', 'descriptor', { precedingWords: [] })
    expect(forms[0].value).toBe('bonito')
    expect(forms[0].hint).toBe('masculino')
  })
})

// Not morphology: this fuses two ADJACENT WORDS, so it belongs to the message
// bar rather than the word-forms popup. Portuguese is the first language in
// the app that needs it.
describe('contractions', () => {
  it('fuses a preposition with a following article', () => {
    expect(contract('de', 'o', 'pt-BR')).toBe('do')
    expect(contract('de', 'a', 'pt-BR')).toBe('da')
    expect(contract('em', 'o', 'pt-BR')).toBe('no')
    expect(contract('em', 'a', 'pt-BR')).toBe('na')
    expect(contract('a', 'o', 'pt-BR')).toBe('ao')
    expect(contract('a', 'as', 'pt-BR')).toBe('às')
    expect(contract('por', 'o', 'pt-BR')).toBe('pelo')
  })

  it('fuses with pronouns and demonstratives too', () => {
    expect(contract('de', 'ele', 'pt-BR')).toBe('dele')
    expect(contract('em', 'esse', 'pt-BR')).toBe('nesse')
    expect(contract('de', 'aquilo', 'pt-BR')).toBe('daquilo')
    expect(contract('em', 'um', 'pt-BR')).toBe('num')
  })

  it('keeps an initial capital', () => {
    expect(contract('De', 'o', 'pt-BR')).toBe('Do')
    expect(contract('Em', 'a', 'pt-BR')).toBe('Na')
  })

  it('returns null when the two words do not contract', () => {
    expect(contract('de', 'casa', 'pt-BR')).toBeNull()
    expect(contract('com', 'o', 'pt-BR')).toBeNull() // `com o` stays separate
    expect(contract('quero', 'o', 'pt-BR')).toBeNull()
  })

  it('covers the two Spanish contractions and nothing else', () => {
    expect(contract('a', 'el', 'es-ES')).toBe('al')
    expect(contract('de', 'el', 'es-ES')).toBe('del')
    expect(contract('de', 'la', 'es-ES')).toBeNull()
  })

  it('does nothing for languages that do not contract', () => {
    expect(hasContractions('en-US')).toBe(false)
    expect(hasContractions('pl-PL')).toBe(false)
    expect(contract('de', 'o', 'en-US')).toBeNull()
    expect(contract('a', 'o', 'pl-PL')).toBeNull()
  })
})

describe('language dispatch', () => {
  it('routes by BCP-47 tag', () => {
    expect(values(wordForms('comer', 'verb', 'pt-BR'))).toContain('comemos')
    expect(values(wordForms('comer', 'verb', 'es-ES'))).toContain('comemos')
    // ...but the Spanish engine offers `tú` and the Portuguese one does not.
    expect(values(wordForms('comer', 'verb', 'es-ES'))).toContain('comes')
    expect(values(wordForms('comer', 'verb', 'pt-BR'))).not.toContain('comes')
  })
})

// The same guard that caught nine rule failures in Polish, applied to the
// Portuguese boards: every word actually shipped is run through the engine.
describe('every board word inflects without falling through', () => {
  const board = require('../../src/data/coreWords.pt.json')
  const collect = (want: string) => {
    const out = new Set<string>()
    for (const layout of Object.values<any>(board.sizes)) {
      const all = [...layout.core, ...Object.values<any>(layout.topics).flat()]
      for (const [word, pos] of all as Array<[string, string]>) {
        if (!word.includes(' ') && pos === want) out.add(word)
      }
    }
    return [...out].sort()
  }

  // Sequences that only appear when an ending was appended to a stem that
  // should have been altered first.
  const MALFORMED = /(aa|oo(?!k)|ss$|ãos s|ãoe|ãos e|es s|ões s)/

  it.each(collect('noun'))('noun: %s', (word) => {
    for (const form of portugueseWordForms(word, 'noun')) {
      expect({ word, form: form.value, malformed: MALFORMED.test(form.value) })
        .toEqual({ word, form: form.value, malformed: false })
    }
  })

  it.each(collect('descriptor'))('adjective: %s', (word) => {
    for (const form of portugueseWordForms(word, 'descriptor')) {
      expect({ word, form: form.value, malformed: MALFORMED.test(form.value) })
        .toEqual({ word, form: form.value, malformed: false })
    }
  })

  it.each(collect('verb'))('verb: %s', (word) => {
    const forms = portugueseWordForms(word, 'verb')
    // An infinitive that produced no paradigm collapses to one form.
    if (/(ar|er|ir|ôr)$/.test(word)) expect(forms.length).toBeGreaterThan(1)
    for (const form of forms) {
      expect({ word, form: form.value, malformed: MALFORMED.test(form.value) })
        .toEqual({ word, form: form.value, malformed: false })
    }
  })
})
