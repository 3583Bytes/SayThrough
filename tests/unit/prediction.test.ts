import {
  EMPTY_MODEL,
  applyCaseOf,
  learn,
  normalizeWord,
  rankPredictions,
  type PersonalModel,
} from '../../src/services/prediction'

// A stand-in for the real asset: frequency-ordered, most common first.
const LEXICON = [
  'the', 'i', 'you', 'to', 'want', 'was', 'way', 'wait', 'wanted', 'water',
  'wall', 'walk', 'grand', 'grab', 'grade', 'grandma', 'help', 'hungry', 'hurt',
]

const words = (predictions: { word: string }[]) => predictions.map((p) => p.word)

describe('normalizeWord', () => {
  it('lowercases and strips surrounding punctuation', () => {
    expect(normalizeWord('Hello!')).toBe('hello')
    expect(normalizeWord('"water"')).toBe('water')
  })

  it('keeps internal apostrophes so contractions survive', () => {
    expect(normalizeWord("Don't")).toBe("don't")
  })
})

describe('applyCaseOf', () => {
  it('mirrors the case the user typed', () => {
    expect(applyCaseOf('wa', 'want')).toBe('want')
    expect(applyCaseOf('Wa', 'want')).toBe('Want')
    expect(applyCaseOf('WA', 'want')).toBe('WANT')
  })

  it('leaves the word alone when nothing was typed', () => {
    expect(applyCaseOf('', 'want')).toBe('want')
  })
})

describe('rankPredictions — base lexicon', () => {
  it('returns prefix matches in frequency order', () => {
    const got = rankPredictions('wa', undefined, { lexicon: LEXICON }, 4)
    expect(words(got)).toEqual(['want', 'was', 'way', 'wait'])
  })

  it('never suggests the word already fully typed', () => {
    const got = rankPredictions('want', undefined, { lexicon: LEXICON }, 4)
    expect(words(got)).not.toContain('want')
    expect(words(got)).toContain('wanted')
  })

  it('returns nothing for an unmatched prefix', () => {
    expect(rankPredictions('zzz', undefined, { lexicon: LEXICON })).toEqual([])
  })

  it('degrades quietly when the asset failed to load', () => {
    expect(rankPredictions('wa', undefined, { lexicon: [] })).toEqual([])
  })

  it('respects the limit', () => {
    expect(rankPredictions('wa', undefined, { lexicon: LEXICON }, 2)).toHaveLength(2)
  })
})

describe('rankPredictions — personal model', () => {
  it("puts the user's own words ahead of commoner corpus words", () => {
    const personal: PersonalModel = {
      unigrams: { water: 20 },
      bigrams: {},
    }
    // "want", "was" and "way" all outrank "water" in the corpus.
    const got = rankPredictions('wa', undefined, { lexicon: LEXICON, personal })
    expect(got[0]).toEqual({ word: 'water', source: 'personal' })
  })

  it('uses the previous word to pick a continuation', () => {
    const personal: PersonalModel = {
      unigrams: {},
      bigrams: { i: { hurt: 9, want: 1 } },
    }
    const got = rankPredictions('h', 'i', { lexicon: LEXICON, personal })
    expect(got[0].word).toBe('hurt')
  })

  it('is inert with an empty model — pure corpus frequency', () => {
    const withModel = rankPredictions('wa', undefined, {
      lexicon: LEXICON,
      personal: EMPTY_MODEL,
    })
    const without = rankPredictions('wa', undefined, { lexicon: LEXICON })
    expect(words(withModel)).toEqual(words(without))
  })
})

describe('rankPredictions — the user’s own vocabulary', () => {
  it('lifts a button label above commoner corpus words', () => {
    const got = rankPredictions('gra', undefined, {
      lexicon: LEXICON,
      vocabulary: ['Grandma'],
    })
    // "grand", "grab" and "grade" are all likelier in the corpus.
    expect(got[0]).toEqual({ word: 'grandma', source: 'vocabulary' })
  })
})

describe('rankPredictions — next-word mode', () => {
  it('uses seeded AAC frames before the model has learned anything', () => {
    const got = rankPredictions('', 'i', { lexicon: LEXICON, language: 'en-US' })
    expect(words(got)).toContain('want')
  })

  it('lets a learned bigram beat the seeded frame', () => {
    const personal: PersonalModel = {
      unigrams: {},
      bigrams: { i: { hurt: 50 } },
    }
    const got = rankPredictions('', 'i', {
      lexicon: LEXICON,
      personal,
      language: 'en-US',
    })
    expect(got[0].word).toBe('hurt')
  })

  it('stays empty rather than flooding the bar with common words', () => {
    // No previous word and no prefix — the corpus must not be consulted.
    expect(rankPredictions('', undefined, { lexicon: LEXICON })).toEqual([])
  })

  it('never offers the word that was just entered', () => {
    const personal: PersonalModel = { unigrams: { i: 30 }, bigrams: { i: { want: 3 } } }
    const got = rankPredictions('', 'i', { lexicon: LEXICON, personal, language: 'en-US' })
    expect(words(got)).not.toContain('i')
  })

  it('does not let context-free personal words crowd out continuations', () => {
    // "juice" is the user's most-used word but never follows "thank"; the
    // seeded "thank you" frame must still win the bar.
    const personal: PersonalModel = {
      unigrams: { juice: 99 },
      bigrams: {},
    }
    const got = rankPredictions('', 'thank', {
      lexicon: LEXICON,
      personal,
      language: 'en-US',
    })
    expect(words(got)).toEqual(['you'])
  })

  it('still uses personal words once a prefix is typed', () => {
    const personal: PersonalModel = { unigrams: { water: 20 }, bigrams: {} }
    const got = rankPredictions('wa', 'thank', { lexicon: LEXICON, personal })
    expect(got[0].word).toBe('water')
  })
})

describe('learn', () => {
  it('counts words and adjacent pairs', () => {
    const model = learn(EMPTY_MODEL, ['I', 'want', 'water'])
    expect(model.unigrams).toEqual({ i: 1, want: 1, water: 1 })
    expect(model.bigrams.i).toEqual({ want: 1 })
    expect(model.bigrams.want).toEqual({ water: 1 })
  })

  it('accumulates across messages', () => {
    const model = learn(learn(EMPTY_MODEL, ['more', 'please']), ['more', 'please'])
    expect(model.unigrams.more).toBe(2)
    expect(model.bigrams.more.please).toBe(2)
  })

  it('normalizes punctuation and case so variants share a count', () => {
    const model = learn(EMPTY_MODEL, ['Hello!', 'hello'])
    expect(model.unigrams).toEqual({ hello: 2 })
  })

  it('does not mutate the model it was given', () => {
    const before = learn(EMPTY_MODEL, ['water'])
    const snapshot = JSON.parse(JSON.stringify(before))
    learn(before, ['water', 'please'])
    expect(before).toEqual(snapshot)
  })

  it('ignores an empty or punctuation-only message', () => {
    expect(learn(EMPTY_MODEL, [])).toEqual(EMPTY_MODEL)
    expect(learn(EMPTY_MODEL, ['!', '?'])).toEqual(EMPTY_MODEL)
  })

  it('caps continuations per head word', () => {
    let model = EMPTY_MODEL
    for (let i = 0; i < 20; i++) model = learn(model, ['go', `place${i}`])
    expect(Object.keys(model.bigrams.go).length).toBeLessThanOrEqual(8)
  })

  it('halves counts instead of dropping the model when it overflows', () => {
    let model = EMPTY_MODEL
    for (let i = 0; i < 600; i++) model = learn(model, [`word${i}`])
    // Aged, but still holding vocabulary rather than reset to nothing.
    expect(Object.keys(model.unigrams).length).toBeGreaterThan(0)
    expect(Object.keys(model.unigrams).length).toBeLessThanOrEqual(600)
  })
})
