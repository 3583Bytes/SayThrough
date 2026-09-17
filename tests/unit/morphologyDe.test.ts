import {
  adjectiveAgreement,
  conjugate,
  germanWordForms,
  inferGender,
  pluralize,
  splitSeparable,
} from '../../src/services/morphology.de'
import { contract, hasContractions } from '../../src/services/contractions'
import { readFileSync } from 'node:fs'
import germanBoard from '../../src/data/coreWords.de.json'

describe('German gender', () => {
  it('reads the suffixes that decide outright', () => {
    expect(inferGender('Zeitung')).toBe('f')
    expect(inferGender('Freiheit')).toBe('f')
    expect(inferGender('Mädchen')).toBe('n')
    expect(inferGender('Lehrling')).toBe('m')
  })

  it('knows the board vocabulary a rule cannot reach', () => {
    // A wrong gender is a wrong article on every single use, which is why
    // board words are tabled rather than guessed.
    expect(inferGender('Mädchen')).toBe('n')
    expect(inferGender('Frau')).toBe('f')
    expect(inferGender('Kind')).toBe('n')
    expect(inferGender('Mann')).toBe('m')
    expect(inferGender('Wasser')).toBe('n')
    expect(inferGender('Milch')).toBe('f')
  })
})

describe('German plurals', () => {
  it('handles the umlaut plurals no rule predicts', () => {
    expect(pluralize('Mann')).toBe('Männer')
    expect(pluralize('Buch')).toBe('Bücher')
    expect(pluralize('Apfel')).toBe('Äpfel')
    expect(pluralize('Hand')).toBe('Hände')
  })

  it('gives feminines -(e)n', () => {
    expect(pluralize('Frau')).toBe('Frauen')
    expect(pluralize('Banane')).toBe('Bananen')
    expect(pluralize('Zeitung')).toBe('Zeitungen')
  })

  it('doubles the n for -in', () => {
    expect(pluralize('Lehrerin')).toBe('Lehrerinnen')
  })

  it('leaves diminutives and -er/-en/-el masculines alone', () => {
    expect(pluralize('Mädchen')).toBe('Mädchen')
    expect(pluralize('Lehrer')).toBe('Lehrer')
  })

  it('capitalises, because in German that is spelling and not style', () => {
    expect(pluralize('tag')).toBe('Tage')
    expect(pluralize('frau')).toBe('Frauen')
  })
})

describe('German nouns in the popup', () => {
  it('declines on the ARTICLE, which is where German puts the case', () => {
    const forms = germanWordForms('Mann', 'noun').map((f) => f.value)
    expect(forms).toContain('der Mann')
    expect(forms).toContain('den Mann')
    expect(forms).toContain('dem Mann')
    expect(forms).toContain('ein Mann')
    expect(forms).toContain('Männer')
  })

  it('uses the right article for each gender', () => {
    expect(germanWordForms('Frau', 'noun').map((f) => f.value)).toContain('die Frau')
    expect(germanWordForms('Kind', 'noun').map((f) => f.value)).toContain('das Kind')
  })
})

describe('German adjectives', () => {
  it('leads with the predicative form, which takes no ending at all', () => {
    // `der Mann ist gut` / `die Frau ist gut` — no agreement, so it is always
    // safe, and that is how most of these get used on a board.
    const forms = germanWordForms('gut', 'descriptor')
    expect(forms[0]).toEqual({ value: 'gut', hint: 'nach ist' })
  })

  it('offers weak and mixed endings', () => {
    const forms = adjectiveAgreement('gut')
    expect(forms.weak).toBe('gute')
    expect(forms.mixedM).toBe('guter')
    expect(forms.mixedN).toBe('gutes')
  })

  it('knows the irregular comparatives', () => {
    expect(adjectiveAgreement('gut').comparative).toBe('besser')
    expect(adjectiveAgreement('gut').superlative).toBe('am besten')
    expect(adjectiveAgreement('viel').comparative).toBe('mehr')
  })

  it('umlauts the comparative where German does', () => {
    expect(adjectiveAgreement('alt').comparative).toBe('älter')
    expect(adjectiveAgreement('jung').comparative).toBe('jünger')
    // …and does not where it does not.
    expect(adjectiveAgreement('schön').comparative).toBe('schöner')
  })

  it('drops the unstressed -e- before an ending', () => {
    // `dunkeler` is not a word.
    expect(adjectiveAgreement('dunkel').weak).toBe('dunkle')
    expect(adjectiveAgreement('teuer').comparative).toBe('teurer')
  })

  it('agrees with a capitalised noun already in the bar', () => {
    // German capitalises its nouns, which is a free signal the other engines
    // do not get — it is how the target is found at all.
    const forms = germanWordForms('gut', 'descriptor', { precedingWords: ['die', 'Frau'] })
    expect(forms.some((f) => f.hint === 'passt dazu')).toBe(true)
  })
})

describe('German verbs', () => {
  it('conjugates a regular weak verb', () => {
    expect(conjugate('machen')).toMatchObject({
      ich: 'mache', du: 'machst', er: 'macht',
      wir: 'machen', ihr: 'macht', partizip: 'gemacht',
    })
  })

  it('links an -e- where the ending would be unsayable', () => {
    expect(conjugate('arbeiten')).toMatchObject({ du: 'arbeitest', er: 'arbeitet' })
  })

  it('gives a stem in s/ß/z only -t in du', () => {
    expect(conjugate('tanzen')).toMatchObject({ du: 'tanzt' })
  })

  it('changes the stem vowel of a strong verb in du and er', () => {
    expect(conjugate('fahren')).toMatchObject({ ich: 'fahre', du: 'fährst', er: 'fährt' })
    expect(conjugate('geben')).toMatchObject({ ich: 'gebe', du: 'gibst', er: 'gibt' })
    expect(conjugate('lesen')).toMatchObject({ du: 'liest', er: 'liest' })
  })

  it('knows the modals, which have no ending in ich and er', () => {
    expect(conjugate('können')).toMatchObject({ ich: 'kann', er: 'kann', du: 'kannst' })
    expect(conjugate('müssen')).toMatchObject({ ich: 'muss', er: 'muss' })
    expect(conjugate('wollen')).toMatchObject({ ich: 'will', er: 'will' })
    expect(conjugate('sein')).toMatchObject({ ich: 'bin', du: 'bist', er: 'ist' })
  })
})

describe('German separable verbs', () => {
  it('recognises a separable prefix, and only a real one', () => {
    expect(splitSeparable('aufstehen')).toEqual({ prefix: 'auf', stem: 'stehen' })
    expect(splitSeparable('anziehen')).toEqual({ prefix: 'an', stem: 'ziehen' })
    // `verstehen` is inseparable, and nothing in the spelling says so.
    expect(splitSeparable('verstehen')).toBeNull()
    expect(splitSeparable('machen')).toBeNull()
  })

  it('trails the particle as ONE token rather than attempting clause order', () => {
    // The design decision: `stehe auf` is what the speaker means and what a
    // listener hears. True clause-final placement would need the whole clause
    // and would break the moment anyone edits the middle of a message.
    expect(conjugate('aufstehen')).toMatchObject({
      ich: 'stehe auf', du: 'stehst auf', er: 'steht auf',
    })
  })

  it('rejoins the participle around the ge-', () => {
    // `aufgestanden`, never `geaufstanden`.
    expect(conjugate('aufstehen')?.partizip).toBe('aufgestanden')
  })

  it('leads the popup with the infinitive, which is what follows a modal', () => {
    // This is the whole resolution: `ich will aufstehen` is complete, correct
    // German with the verb intact, so the board leans on modal + infinitive.
    const forms = germanWordForms('aufstehen', 'verb')
    expect(forms[0]).toEqual({ value: 'aufstehen', hint: 'nach will / kann / muss' })
  })
})

describe('German contractions', () => {
  it('is a language that contracts at all', () => {
    expect(hasContractions('de-DE')).toBe(true)
  })

  it('fuses the everyday preposition-article pairs', () => {
    expect(contract('in', 'dem', 'de')).toBe('im')
    expect(contract('in', 'das', 'de')).toBe('ins')
    expect(contract('zu', 'dem', 'de')).toBe('zum')
    expect(contract('zu', 'der', 'de')).toBe('zur')
    expect(contract('an', 'dem', 'de')).toBe('am')
    expect(contract('von', 'dem', 'de')).toBe('vom')
  })

  it('leaves the colloquial ones alone', () => {
    // `aufs` and `durchs` are ordinary in speech but casual on the page, and a
    // communication device should not make its user sound casual by accident.
    expect(contract('auf', 'das', 'de')).toBeNull()
    expect(contract('durch', 'das', 'de')).toBeNull()
  })

  it('keeps an initial capital on the fused form', () => {
    expect(contract('In', 'dem', 'de')).toBe('Im')
  })
})

describe('German pronouns and function words', () => {
  it('offers the case forms a sentence needs', () => {
    const forms = germanWordForms('ich', 'pronoun').map((f) => f.value)
    expect(forms).toContain('mich')
    expect(forms).toContain('mir')
    expect(forms).toContain('mein')
  })

  it('leaves function words alone', () => {
    expect(germanWordForms('und', 'little')).toEqual([{ value: 'und', hint: '' }])
    expect(germanWordForms('danke', 'social')).toEqual([{ value: 'danke', hint: '' }])
  })
})

describe('German board gender coverage', () => {
  it('every noun on the board has a gender that is not a guess', () => {
    // German gender cannot be read off the word, so `inferGender` falls back
    // to masculine. For a board noun that fallback is not a near-miss — it is
    // the wrong article every single time the word is used. This test is the
    // reason the table is long: 108 of 215 nouns were silently falling
    // through when German first landed.
    const source = readFileSync('src/services/morphology.de.ts', 'utf8')
    const table = source.split('const GENDER: Record<string, Gender> = {')[1].split('\n}')[0]
    const tabled = new Set(
      [...table.matchAll(/([\wäöüß]+):\s*'[mfn]'/gu)].map((m) => m[1]),
    )
    const SUFFIX =
      /(ung|heit|keit|schaft|ion|tät|ik|ei|enz|anz|ur|üre|chen|lein|ment|um|tum|ling|ismus|ant|ist|or|är)$/

    type Layout = { topics: Record<string, Array<[string, string, number]>> }
    const sizes = germanBoard.sizes as unknown as Record<string, Layout>

    const nouns = new Set<string>()
    for (const layout of Object.values(sizes)) {
      for (const words of Object.values(layout.topics)) {
        for (const [label, pos] of words) if (pos === 'noun') nouns.add(label)
      }
    }

    // Each entry here would be a wrong article on every single use.
    const guessing = [...nouns].filter(
      (n) => !tabled.has(n.toLowerCase()) && !SUFFIX.test(n.toLowerCase()),
    )
    expect(guessing).toEqual([])
  })
})
