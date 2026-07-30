import { wordForms } from '../../src/services/morphology'

const values = (word: string, pos?: Parameters<typeof wordForms>[1]) =>
  wordForms(word, pos).map((f) => f.value)

describe('morphology — word forms (§Tier-1)', () => {
  test('regular verb inflects', () => {
    expect(values('want', 'verb')).toEqual(['want', 'wants', 'wanting', 'wanted'])
  })

  test('CVC verb doubles the final consonant', () => {
    expect(values('stop', 'verb')).toEqual(['stop', 'stops', 'stopping', 'stopped'])
  })

  test('irregular verb uses the past + participle table', () => {
    expect(values('go', 'verb')).toEqual(['go', 'goes', 'going', 'went', 'gone'])
    expect(values('eat', 'verb')).toEqual(['eat', 'eats', 'eating', 'ate', 'eaten'])
  })

  test('verb whose forms collapse is de-duplicated (put)', () => {
    expect(values('put', 'verb')).toEqual(['put', 'puts', 'putting'])
  })

  test('noun → plural + possessive, incl. irregular plural', () => {
    expect(values('cat', 'noun')).toEqual(['cat', 'cats', "cat's"])
    expect(values('child', 'noun')).toEqual(['child', 'children', "child's"])
  })

  test('adjective → comparative + superlative, incl. irregular', () => {
    expect(values('big', 'descriptor')).toEqual(['big', 'bigger', 'biggest'])
    expect(values('good', 'descriptor')).toEqual(['good', 'better', 'best'])
    expect(values('happy', 'descriptor')).toEqual(['happy', 'happier', 'happiest'])
  })

  test('pronoun → object + possessives', () => {
    expect(values('I', 'pronoun')).toEqual(['I', 'me', 'my', 'mine'])
  })

  test('function words offer no alternate forms', () => {
    expect(values('more', 'little')).toEqual(['more'])
    expect(wordForms('more', 'little').length).toBe(1)
  })

  test('unknown POS falls back to generic endings', () => {
    expect(values('jump')).toEqual(['jump', 'jumps', 'jumping', 'jumped', "jump's"])
  })
})
