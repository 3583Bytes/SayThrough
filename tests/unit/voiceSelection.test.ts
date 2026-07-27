import {
  isNoveltyVoice,
  pickDefaultVoice,
  rankVoices,
  type RankableVoice,
} from '../../src/services/voiceSelection'

// A realistic macOS Chrome voice list (the case that produced the
// "crappy robot" default before §10.2 ranking existed).
const MAC: RankableVoice[] = [
  { identifier: 'albert', name: 'Albert', language: 'en-US', localService: true },
  { identifier: 'fred', name: 'Fred', language: 'en-US', localService: true },
  { identifier: 'zarvox', name: 'Zarvox', language: 'en-US', localService: true },
  { identifier: 'bubbles', name: 'Bubbles', language: 'en-US', localService: true },
  { identifier: 'google', name: 'Google US English', language: 'en-US', localService: false },
  { identifier: 'samantha', name: 'Samantha', language: 'en-US', localService: true },
  { identifier: 'thomas', name: 'Thomas', language: 'fr-FR', localService: true },
]

describe('voiceSelection (§10.2)', () => {
  test('novelty voices are recognized', () => {
    expect(isNoveltyVoice({ identifier: 'z', name: 'Zarvox', language: 'en-US' })).toBe(true)
    expect(isNoveltyVoice({ identifier: 's', name: 'Samantha', language: 'en-US' })).toBe(false)
  })

  test('default pick is a real, quality voice — never a novelty one', () => {
    const pick = pickDefaultVoice(MAC, 'en-US')
    expect(pick?.name).toBe('Samantha')
  })

  test('ranking excludes novelty voices and other languages', () => {
    const names = rankVoices(MAC, 'en-US').map((v) => v.name)
    expect(names).not.toContain('Albert')
    expect(names).not.toContain('Fred')
    expect(names).not.toContain('Zarvox')
    expect(names).not.toContain('Thomas') // fr-FR filtered out for en
    expect(names).toContain('Samantha')
  })

  test('neural/natural voices outrank everything when present', () => {
    const withNatural = [
      ...MAC,
      {
        identifier: 'aria',
        name: 'Microsoft Aria Online (Natural) - English (United States)',
        language: 'en-US',
        localService: false,
      },
    ]
    expect(pickDefaultVoice(withNatural, 'en-US')?.name).toContain('Natural')
  })

  test('empty voice list is handled safely', () => {
    expect(pickDefaultVoice([], 'en-US')).toBeUndefined()
    expect(rankVoices([], 'en-US')).toEqual([])
  })
})
