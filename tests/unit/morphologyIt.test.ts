import {
  adjectiveAgreement,
  conjugate,
  inferGender,
  italianWordForms,
  pluralize,
} from '../../src/services/morphology.it'
import { contract, hasContractions } from '../../src/services/contractions'

describe('Italian plurals', () => {
  it('takes -o and -e to -i, and -a to -e', () => {
    expect(pluralize('libro')).toBe('libri')
    expect(pluralize('cane')).toBe('cani')
    expect(pluralize('casa')).toBe('case')
  })

  it('keeps a hard c or g with an inserted h', () => {
    // Italian writes the sound. Without the -h- these become `gioci` and
    // `amiche` → `amice`, which are different words' spellings.
    expect(pluralize('gioco')).toBe('giochi')
    expect(pluralize('amica')).toBe('amiche')
    expect(pluralize('riga')).toBe('righe')
  })

  it('softens the velar where the stress falls back a syllable', () => {
    // Nothing in the spelling predicts this, which is why it is a table.
    expect(pluralize('amico')).toBe('amici')
    expect(pluralize('medico')).toBe('medici')
  })

  it('keeps the i of -cia/-gia only after a vowel', () => {
    expect(pluralize('camicia')).toBe('camicie')
    expect(pluralize('arancia')).toBe('arance')
  })

  it('handles the body-part plurals that change gender', () => {
    expect(pluralize('braccio')).toBe('braccia')
    expect(pluralize('uovo')).toBe('uova')
    expect(pluralize('mano')).toBe('mani')
  })

  it('leaves invariable nouns alone', () => {
    // A board that pluralised these would invent words.
    expect(pluralize('città')).toBe('città')
    expect(pluralize('caffè')).toBe('caffè')
    expect(pluralize('bar')).toBe('bar')
  })

  it('gives the Greek -ma masculines -i, not -e', () => {
    expect(pluralize('problema')).toBe('problemi')
    expect(pluralize('programma')).toBe('programmi')
  })
})

describe('Italian gender', () => {
  it('reads the ordinary endings', () => {
    expect(inferGender('libro')).toBe('m')
    expect(inferGender('casa')).toBe('f')
  })

  it('knows the families a rule gets backwards', () => {
    expect(inferGender('problema')).toBe('m')
    expect(inferGender('mano')).toBe('f')
    expect(inferGender('stazione')).toBe('f')
    expect(inferGender('notte')).toBe('f')
    expect(inferGender('pane')).toBe('m')
  })
})

describe('Italian adjectives', () => {
  it('gives the four-form class all four', () => {
    expect(adjectiveAgreement('piccolo')).toEqual({
      ms: 'piccolo', fs: 'piccola', mp: 'piccoli', fp: 'piccole',
    })
  })

  it('marks only number on the two-form class', () => {
    expect(adjectiveAgreement('grande')).toEqual({
      ms: 'grande', fs: 'grande', mp: 'grandi', fp: 'grandi',
    })
  })

  it('agrees with the noun already in the message bar', () => {
    const forms = italianWordForms('piccolo', 'descriptor', {
      precedingWords: ['la', 'casa'],
    })
    expect(forms[0]).toEqual({ value: 'piccola', hint: 'concorda' })
  })

  it('agrees in the plural, reading gender off the singular', () => {
    // `case` ends in -e, which alone would read as masculine — the engine has
    // to undo the plural before asking.
    const forms = italianWordForms('piccolo', 'descriptor', {
      precedingWords: ['le', 'case'],
    })
    expect(forms[0]).toEqual({ value: 'piccole', hint: 'concorda' })
  })

  it('offers the irregular comparative rather than “più buono”', () => {
    const forms = italianWordForms('buono', 'descriptor')
    expect(forms.map((f) => f.value)).toContain('migliore')
  })
})

describe('Italian verbs', () => {
  it('conjugates the three regular classes', () => {
    expect(conjugate('parlare')).toMatchObject({
      io: 'parlo', tu: 'parli', lui: 'parla',
      noi: 'parliamo', voi: 'parlate', loro: 'parlano',
    })
    expect(conjugate('credere')).toMatchObject({ io: 'credo', loro: 'credono' })
    expect(conjugate('dormire')).toMatchObject({ io: 'dormo', voi: 'dormite' })
  })

  it('writes the sound: -care/-gare take an h before a front vowel', () => {
    expect(conjugate('giocare')).toMatchObject({ tu: 'giochi', noi: 'giochiamo' })
    expect(conjugate('pagare')).toMatchObject({ tu: 'paghi', noi: 'paghiamo' })
  })

  it('writes the sound: -ciare/-giare do not double the i', () => {
    expect(conjugate('mangiare')).toMatchObject({ tu: 'mangi', noi: 'mangiamo' })
    expect(conjugate('cominciare')).toMatchObject({ tu: 'cominci', noi: 'cominciamo' })
  })

  it('does not harden a c or g that was already soft in the infinitive', () => {
    // -ere and -ire put the c before a front vowel already, so an inserted h
    // would change the word: `vinchi` is not a form of vincere.
    expect(conjugate('vincere')).toMatchObject({ tu: 'vinci', noi: 'vinciamo' })
  })

  it('infixes -isc- for the closed -ire class', () => {
    expect(conjugate('capire')).toMatchObject({
      io: 'capisco', tu: 'capisci', lui: 'capisce',
      noi: 'capiamo', loro: 'capiscono',
    })
    // …and not for the rest of -ire.
    expect(conjugate('sentire')).toMatchObject({ io: 'sento', loro: 'sentono' })
  })

  it('knows the irregulars a board cannot do without', () => {
    expect(conjugate('essere')).toMatchObject({ io: 'sono', tu: 'sei', lui: 'è' })
    expect(conjugate('avere')).toMatchObject({ io: 'ho', loro: 'hanno' })
    expect(conjugate('andare')).toMatchObject({ io: 'vado', noi: 'andiamo' })
    expect(conjugate('volere')).toMatchObject({ io: 'voglio', lui: 'vuole' })
  })

  it('offers all six persons, because Italian has not collapsed them', () => {
    const hints = italianWordForms('parlare', 'verb').map((f) => f.hint)
    expect(hints).toEqual(
      expect.arrayContaining(['io', 'tu', 'lui / lei', 'noi', 'voi', 'loro']),
    )
  })
})

describe('Italian contractions', () => {
  it('is a language that contracts at all', () => {
    expect(hasContractions('it-IT')).toBe(true)
  })

  it('fuses the preposition with every article form', () => {
    // Obligatory, not stylistic: `a il parco` is wrong, not merely clumsy.
    expect(contract('a', 'il', 'it')).toBe('al')
    expect(contract('di', 'la', 'it')).toBe('della')
    expect(contract('da', 'gli', 'it')).toBe('dagli')
    expect(contract('in', 'i', 'it')).toBe('nei')
    expect(contract('su', 'lo', 'it')).toBe('sullo')
  })

  it('keeps an initial capital on the fused form', () => {
    expect(contract('A', 'il', 'it')).toBe('Al')
  })

  it('leaves `con` alone, which modern Italian writes separately', () => {
    expect(contract('con', 'il', 'it')).toBeNull()
  })

  it('does not fuse words that simply follow each other', () => {
    expect(contract('di', 'casa', 'it')).toBeNull()
  })
})

describe('Italian nouns and pronouns', () => {
  it('uses `di` for possession, not an ending', () => {
    const forms = italianWordForms('casa', 'noun')
    expect(forms.map((f) => f.value)).toContain('di casa')
    expect(forms.map((f) => f.value)).toContain('la casa')
  })

  it('offers the clitics a sentence actually needs', () => {
    const forms = italianWordForms('io', 'pronoun').map((f) => f.value)
    expect(forms).toContain('mi')
    expect(forms).toContain('mio')
  })

  it('leaves function words alone', () => {
    expect(italianWordForms('e', 'little')).toEqual([{ value: 'e', hint: '' }])
    expect(italianWordForms('grazie', 'social')).toEqual([{ value: 'grazie', hint: '' }])
  })
})
