import { TtsRouter } from '../../src/services/TTSService'
import type { SpeakRequest, TtsBackend } from '../../src/services/tts/types'

// The real platform backend imports expo-speech; stub it so the router's
// routing and fallback logic can be tested as pure logic.
const spoken: Array<{ backend: string; text: string }> = []
jest.mock('../../src/services/tts/platformBackend', () => ({
  platformBackend: {
    id: 'platform',
    init: jest.fn(async () => true),
    isAvailable: () => true,
    speak: (request: { text: string }) =>
      spoken.push({ backend: 'platform', text: request.text }),
    stop: jest.fn(),
    warmUp: jest.fn(),
    getVoices: () => [],
    bestVoiceId: () => undefined,
    isValidVoiceId: () => false,
  },
}))

function enhanced(overrides: Partial<TtsBackend> = {}): TtsBackend {
  return {
    id: 'enhanced',
    init: async () => true,
    isAvailable: () => true,
    speak: (request: SpeakRequest) =>
      spoken.push({ backend: 'enhanced', text: request.text }),
    stop: jest.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  spoken.length = 0
})

describe('TtsRouter', () => {
  it('uses the platform voice by default', () => {
    const router = new TtsRouter([enhanced()])
    router.speak('hello')
    expect(spoken).toEqual([{ backend: 'platform', text: 'hello' }])
    expect(router.activeBackendId()).toBe('platform')
  })

  it('uses the enhanced voice once preferred', () => {
    const router = new TtsRouter([enhanced()])
    router.setPreferredBackend('enhanced')
    router.speak('hello')
    expect(spoken).toEqual([{ backend: 'enhanced', text: 'hello' }])
    expect(router.activeBackendId()).toBe('enhanced')
  })

  it('falls back when the enhanced voice is not ready', () => {
    const router = new TtsRouter([enhanced({ isAvailable: () => false })])
    router.setPreferredBackend('enhanced')
    router.speak('hello')
    // Still speaks — never silence.
    expect(spoken).toEqual([{ backend: 'platform', text: 'hello' }])
    expect(router.activeBackendId()).toBe('platform')
    expect(router.fallbackReason()).toMatch(/not ready/)
  })

  it('falls back when the enhanced voice throws', () => {
    const router = new TtsRouter([
      enhanced({
        speak: () => {
          throw new Error('model missing')
        },
      }),
    ])
    router.setPreferredBackend('enhanced')
    router.speak('hello')
    expect(spoken).toEqual([{ backend: 'platform', text: 'hello' }])
    expect(router.fallbackReason()).toBe('model missing')
  })

  it('falls back when the enhanced voice fails mid-utterance', () => {
    const router = new TtsRouter([
      enhanced({
        speak: (request) => request.onError?.(new Error('decode failed')),
      }),
    ])
    router.setPreferredBackend('enhanced')
    router.speak('hello')
    // The utterance is re-spoken on the platform voice rather than lost.
    expect(spoken).toEqual([{ backend: 'platform', text: 'hello' }])
    expect(router.fallbackReason()).toBe('decode failed')
  })

  it('clears the fallback reason once the enhanced voice works again', () => {
    let ready = false
    const router = new TtsRouter([enhanced({ isAvailable: () => ready })])
    router.setPreferredBackend('enhanced')
    router.speak('one')
    expect(router.fallbackReason()).toBeTruthy()
    ready = true
    router.speak('two')
    expect(router.fallbackReason()).toBeNull()
  })

  it('applies profile defaults, with per-call overrides winning', () => {
    const seen: SpeakRequest[] = []
    const router = new TtsRouter([enhanced({ speak: (r) => void seen.push(r) })])
    router.setPreferredBackend('enhanced')
    router.configure({ rate: 0.8, volume: 1, language: 'en-US' })
    router.speak('hello')
    router.speak('hello', { rate: 1.4 })
    expect(seen[0].rate).toBe(0.8)
    expect(seen[0].language).toBe('en-US')
    expect(seen[1].rate).toBe(1.4)
  })

  it('stops every backend, not just the active one', () => {
    const stop = jest.fn()
    const router = new TtsRouter([enhanced({ stop })])
    router.stop()
    expect(stop).toHaveBeenCalled()
  })
})
