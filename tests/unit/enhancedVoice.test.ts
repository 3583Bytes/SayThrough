import { boundaryOffsets } from '../../src/services/tts/enhancedBackend.web'

// Neural synthesis emits no word-boundary events, so word-by-word highlight
// (§Tier-1) has to derive them from the clip duration. These are estimates by
// construction; what must hold is that they stay in order, inside the clip,
// and land on real word starts.
describe('derived word boundaries', () => {
  it('emits one boundary per word, at its character offset', () => {
    const text = 'I want juice'
    const got = boundaryOffsets(text, 3)
    expect(got.map(([index]) => index)).toEqual([0, 2, 7])
    expect(text.slice(7)).toBe('juice')
  })

  it('starts at zero and never runs past the clip', () => {
    const got = boundaryOffsets('I want more juice please', 2)
    expect(got[0][1]).toBe(0)
    for (const [, at] of got) {
      expect(at).toBeGreaterThanOrEqual(0)
      expect(at).toBeLessThan(2)
    }
  })

  it('advances monotonically', () => {
    const got = boundaryOffsets('one two three four five', 5)
    const times = got.map(([, at]) => at)
    expect([...times].sort((a, b) => a - b)).toEqual(times)
  })

  it('gives longer words more of the clip', () => {
    const [, [, second], [, third]] = boundaryOffsets('a lengthy x', 3)
    // "lengthy" should occupy more time than the single-character "a".
    expect(third - second).toBeGreaterThan(second)
  })

  it('handles collapsed and irregular whitespace', () => {
    const got = boundaryOffsets('  hello   world  ', 2)
    expect(got.map(([index]) => index)).toEqual([2, 10])
  })

  it('returns nothing for text with no words', () => {
    expect(boundaryOffsets('', 3)).toEqual([])
    expect(boundaryOffsets('   ', 3)).toEqual([])
  })

  it('does not divide by zero on a zero-length clip', () => {
    const got = boundaryOffsets('I want juice', 0)
    expect(got).toHaveLength(3)
    for (const [, at] of got) expect(at).toBe(0)
  })
})
