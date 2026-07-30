import { tokenIdAtChar } from '../../src/utils/tokenRanges'

// "I want cookie" → I:[0,1) space:1 want:[2,6) space:6 cookie:[7,13)
const TOKENS = [
  { id: 'a', text: 'I' },
  { id: 'b', text: 'want' },
  { id: 'c', text: 'cookie' },
]

describe('tokenIdAtChar — word-by-word highlight mapping', () => {
  test('maps a boundary charIndex to the token containing it', () => {
    expect(tokenIdAtChar(TOKENS, 0)).toBe('a')
    expect(tokenIdAtChar(TOKENS, 2)).toBe('b')
    expect(tokenIdAtChar(TOKENS, 5)).toBe('b') // last char of "want"
    expect(tokenIdAtChar(TOKENS, 7)).toBe('c')
    expect(tokenIdAtChar(TOKENS, 12)).toBe('c')
  })

  test('joining spaces and out-of-range indices map to nothing', () => {
    expect(tokenIdAtChar(TOKENS, 1)).toBeNull() // the space after "I"
    expect(tokenIdAtChar(TOKENS, 6)).toBeNull() // the space after "want"
    expect(tokenIdAtChar(TOKENS, 100)).toBeNull()
    expect(tokenIdAtChar([], 0)).toBeNull()
  })
})
