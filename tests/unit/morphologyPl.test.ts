import {
  adjectiveAgreement,
  conjugate,
  declineNoun,
  inferGender,
  polishWordForms,
} from '../../src/services/morphology.pl'
import { wordForms } from '../../src/services/morphology'

// §19.7 Polish word forms. Covers what Polish needs that neither English nor
// Spanish did: case on nouns, the speaker's own gender in the past tense, and
// the masculine-personal plural on adjectives.

const values = (forms: Array<{ value: string }>) => forms.map((f) => f.value)
const hintOf = (forms: Array<{ value: string; hint: string }>, value: string) =>
  forms.find((f) => f.value === value)?.hint

describe('inferGender', () => {
  it('reads the regular endings', () => {
    expect(inferGender('mama')).toBe('f')
    expect(inferGender('woda')).toBe('f')
    expect(inferGender('dom')).toBe('m')
    expect(inferGender('kot')).toBe('m')
    expect(inferGender('okno')).toBe('n')
    expect(inferGender('mleko')).toBe('n')
  })

  it('knows the masculine nouns that end in -a', () => {
    expect(inferGender('tata')).toBe('m')
    expect(inferGender('kolega')).toBe('m')
  })

  it('knows the feminine nouns that end in a consonant', () => {
    expect(inferGender('noc')).toBe('f')
    expect(inferGender('twarz')).toBe('f')
    expect(inferGender('miłość')).toBe('f')
  })
})

describe('declineNoun — feminine in -a', () => {
  it('declines a hard stem with the dative/locative alternation', () => {
    expect(declineNoun('mama')).toEqual({
      nom: 'mama', gen: 'mamy', dat: 'mamie', acc: 'mamę',
      ins: 'mamą', loc: 'mamie', voc: 'mamo', pl: 'mamy',
    })
    expect(declineNoun('woda')).toMatchObject({
      gen: 'wody', dat: 'wodzie', acc: 'wodę', ins: 'wodą', loc: 'wodzie',
    })
    expect(declineNoun('szkoła')).toMatchObject({ loc: 'szkole', acc: 'szkołę' })
    expect(declineNoun('siostra')).toMatchObject({ loc: 'siostrze', acc: 'siostrę' })
  })

  it('takes -i in the genitive after k and g', () => {
    expect(declineNoun('książka')).toMatchObject({ gen: 'książki', loc: 'książce' })
    expect(declineNoun('noga')).toMatchObject({ gen: 'nogi', loc: 'nodze' })
  })
})

describe('declineNoun — masculine', () => {
  it('gives an inanimate noun accusative = nominative', () => {
    expect(declineNoun('dom')).toMatchObject({
      nom: 'dom', gen: 'domu', acc: 'dom', ins: 'domem', loc: 'domu',
    })
  })

  it('gives an animate noun accusative = genitive', () => {
    expect(declineNoun('kot')).toMatchObject({ gen: 'kota', acc: 'kota' })
    // pies loses its vowel: pies → psa
    expect(declineNoun('pies')).toMatchObject({ gen: 'psa', acc: 'psa', ins: 'psem' })
  })

  it('softens k/g before the instrumental -em', () => {
    expect(declineNoun('ptak')).toMatchObject({ ins: 'ptakiem', loc: 'ptaku' })
  })
})

describe('declineNoun — neuter', () => {
  it('declines -o nouns', () => {
    expect(declineNoun('okno')).toMatchObject({
      gen: 'okna', dat: 'oknu', acc: 'okno', ins: 'oknem', loc: 'oknie', pl: 'okna',
    })
  })

  it('takes -u in the locative after k/g', () => {
    expect(declineNoun('mleko')).toMatchObject({ ins: 'mlekiem', loc: 'mleku' })
  })

  it('uses the table for the irregular ones', () => {
    expect(declineNoun('oko')).toMatchObject({ pl: 'oczy' })
    expect(declineNoun('ucho')).toMatchObject({ pl: 'uszy' })
    expect(declineNoun('dziecko')).toMatchObject({ pl: 'dzieci' })
    expect(declineNoun('ręka')).toMatchObject({ loc: 'ręce', pl: 'ręce' })
  })
})

describe('conjugate', () => {
  it('knows the irregular verbs a board cannot do without', () => {
    expect(conjugate('być')).toMatchObject({
      ja: 'jestem', ty: 'jesteś', on: 'jest', my: 'jesteśmy', oni: 'są',
      pastM: 'byłem', pastF: 'byłam',
    })
    expect(conjugate('iść')).toMatchObject({ ja: 'idę', pastM: 'szedłem', pastF: 'szłam' })
    expect(conjugate('jeść')).toMatchObject({ ja: 'jem', oni: 'jedzą' })
    expect(conjugate('móc')).toMatchObject({ ja: 'mogę', ty: 'możesz' })
    expect(conjugate('mieć')).toMatchObject({ ja: 'mam', oni: 'mają' })
  })

  it('handles the regular -ać, -ić/-yć and -ować patterns', () => {
    expect(conjugate('czytać')).toMatchObject({
      ja: 'czytam', ty: 'czytasz', on: 'czyta', my: 'czytamy', oni: 'czytają',
      pastM: 'czytałem', pastF: 'czytałam',
    })
    expect(conjugate('robić')).toMatchObject({ ja: 'robię', ty: 'robisz', oni: 'robią' })
    expect(conjugate('tańczyć')).toMatchObject({ ja: 'tańczę', ty: 'tańczysz' })
    expect(conjugate('pracować')).toMatchObject({ ja: 'pracuję', ty: 'pracujesz' })
  })

  it('returns null for something that is not a verb', () => {
    expect(conjugate('więcej')).toBeNull()
    expect(conjugate('dom')).toBeNull()
  })
})

describe('adjectiveAgreement', () => {
  it('gives the three genders plus both plurals', () => {
    expect(adjectiveAgreement('dobry')).toEqual({
      m: 'dobry', f: 'dobra', n: 'dobre', mp: 'dobrzy', nmp: 'dobre',
    })
  })

  it('softens the stem in the masculine-personal plural', () => {
    // The form that separates "a group including men" from everything else.
    expect(adjectiveAgreement('duży')?.mp).toBe('duzi')
    expect(adjectiveAgreement('mały')?.mp).toBe('mali')
    expect(adjectiveAgreement('młody')?.mp).toBe('młodzi')
  })

  it('returns null for something that is not an adjective', () => {
    expect(adjectiveAgreement('dom')).toBeNull()
  })
})

describe('polishWordForms', () => {
  it('offers a noun its cases, named the way Polish names them', () => {
    const forms = polishWordForms('woda', 'noun')
    expect(values(forms)).toEqual(
      expect.arrayContaining(['woda', 'wodę', 'wody', 'wodzie', 'wodą']),
    )
    // `chcę wodę` is accusative; the hint is the question that selects it.
    expect(hintOf(forms, 'wodę')).toBe('kogo? co?')
    expect(hintOf(forms, 'wody')).toBe('kogo? czego?')
  })

  it('offers a verb its person forms', () => {
    const forms = polishWordForms('czytać', 'verb')
    expect(values(forms)).toEqual(
      expect.arrayContaining(['czytać', 'czytam', 'czytasz', 'czyta', 'czytamy', 'czytają']),
    )
    expect(hintOf(forms, 'czytam')).toBe('ja')
  })

  it('offers the perfective partner where the pair is common', () => {
    expect(values(polishWordForms('robić', 'verb'))).toContain('zrobić')
    expect(hintOf(polishWordForms('robić', 'verb'), 'zrobić')).toBe('dokonany')
  })

  it('returns a single form for words that do not inflect', () => {
    expect(polishWordForms('dziękuję', 'social')).toHaveLength(1)
    expect(polishWordForms('gdzie', 'question')).toHaveLength(1)
    expect(polishWordForms('w', 'little')).toHaveLength(1)
  })
})

// The behaviour that makes Polish different from both other engines: the
// speaker's own gender is grammatically marked, so the board can misgender
// its user unless it knows.
describe('past tense follows the speaker, not the sentence', () => {
  it('leads with the feminine past for a female user', () => {
    const forms = polishWordForms('być', 'verb', { grammaticalGender: 'feminine' })
    const past = forms.filter((f) => f.hint.startsWith('wczoraj'))
    expect(past[0].value).toBe('byłam')
    expect(past[0].hint).toBe('wczoraj')
  })

  it('leads with the masculine past for a male user', () => {
    const forms = polishWordForms('być', 'verb', { grammaticalGender: 'masculine' })
    const past = forms.filter((f) => f.hint.startsWith('wczoraj'))
    expect(past[0].value).toBe('byłem')
  })

  it('offers both, labelled, when no gender is set', () => {
    const forms = polishWordForms('być', 'verb')
    expect(hintOf(forms, 'byłem')).toBe('wczoraj (on)')
    expect(hintOf(forms, 'byłam')).toBe('wczoraj (ona)')
  })

  it('never drops the other form — the user can always override', () => {
    for (const gender of ['masculine', 'feminine'] as const) {
      const forms = values(polishWordForms('chcieć', 'verb', { grammaticalGender: gender }))
      expect(forms).toContain('chciałem')
      expect(forms).toContain('chciałam')
    }
  })
})

describe('adjective agreement with the message bar', () => {
  it('leads with the feminine after a feminine noun', () => {
    const forms = polishWordForms('duży', 'descriptor', { precedingWords: ['woda'] })
    expect(forms[0].value).toBe('duża')
    expect(forms[0].hint).toBe('zgadza się')
  })

  it('leads with the neuter after a neuter noun', () => {
    const forms = polishWordForms('duży', 'descriptor', { precedingWords: ['okno'] })
    expect(forms[0].value).toBe('duże')
  })

  it('agrees with a masculine noun that ends in -a', () => {
    const forms = polishWordForms('dobry', 'descriptor', { precedingWords: ['tata'] })
    expect(forms[0].value).toBe('dobry')
  })

  it('skips function words when looking for the noun', () => {
    const forms = polishWordForms('mały', 'descriptor', {
      precedingWords: ['chcę', 'w', 'książka'],
    })
    expect(forms[0].value).toBe('mała')
  })

  it('falls back to the citation form with nothing to agree with', () => {
    const forms = polishWordForms('dobry', 'descriptor', { precedingWords: [] })
    expect(forms[0].value).toBe('dobry')
    expect(forms[0].hint).toBe('rodzaj męski')
  })
})

describe('language dispatch', () => {
  it('routes by BCP-47 tag', () => {
    expect(values(wordForms('czytać', 'verb', 'pl-PL'))).toContain('czytam')
    expect(values(wordForms('comer', 'verb', 'es-ES'))).toContain('como')
    expect(values(wordForms('eat', 'verb', 'en-US'))).toContain('ate')
  })

  it('never returns duplicate forms', () => {
    for (const [word, pos] of [
      ['dom', 'noun'], ['być', 'verb'], ['dobry', 'descriptor'], ['ja', 'pronoun'],
    ] as const) {
      const forms = values(polishWordForms(word, pos))
      expect(new Set(forms).size).toBe(forms.length)
    }
  })
})

// A guard rather than a spot check: every word the Polish boards actually
// ship is run through the engine, and the output is checked for the shapes
// that mean a rule fell through rather than fired. This is what caught
// `kolegaa`, `butya`, `babciie` and `ptacy` — none of which any hand-written
// example would have covered.
describe('every board word declines without falling through', () => {
  const board = require('../../src/data/coreWords.pl.json')
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
  // `yi` is deliberately absent: `szyi` is correct Polish.
  const MALFORMED = /(aa|ay|yy|iy|ąa|ęe|ii|kiie|ńi|śa|źi)/

  it.each(collect('noun'))('noun: %s', (word) => {
    const forms = polishWordForms(word, 'noun')
    // A noun with no paradigm collapses to a single form — correct for the
    // indeclinable loanwords, a bug for everything else.
    const INDECLINABLE = new Set(['kakao'])
    if (!INDECLINABLE.has(word)) expect(forms.length).toBeGreaterThan(1)
    for (const form of forms) {
      expect({ word, form: form.value, malformed: MALFORMED.test(form.value) })
        .toEqual({ word, form: form.value, malformed: false })
    }
  })

  it.each(collect('descriptor'))('adjective: %s', (word) => {
    for (const form of polishWordForms(word, 'descriptor')) {
      expect({ word, form: form.value, malformed: MALFORMED.test(form.value) })
        .toEqual({ word, form: form.value, malformed: false })
    }
  })

  it.each(collect('verb'))('verb: %s', (word) => {
    for (const form of polishWordForms(word, 'verb')) {
      expect({ word, form: form.value, malformed: MALFORMED.test(form.value) })
        .toEqual({ word, form: form.value, malformed: false })
    }
  })
})
