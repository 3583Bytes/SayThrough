import type * as Speech from 'expo-speech'
import { enhancedBackend } from './tts/enhancedBackend'
import { platformBackend } from './tts/platformBackend'
import type { TtsBackend, TtsBackendId } from './tts/types'

export type { TtsBackendId } from './tts/types'

export interface SpeakOptions {
  voiceId?: string // platform voice identifier → Speech `voice`
  language?: string // BCP-47 tag → Speech `language`
  rate?: number
  pitch?: number
  volume?: number
  onStart?: () => void
  onDone?: () => void
  onStopped?: () => void
  onError?: (error: Error) => void
  // Fired as each word is reached (word-by-word highlight). charIndex is
  // the offset into `text`.
  onBoundary?: (charIndex: number) => void
}

// technical-specification.md §10.1 / §10.4
//
// Routes every utterance to a backend. The platform synthesiser is always
// registered and is the fallback; optional engines (§10.5 enhanced neural
// voice) register alongside it and are used only while genuinely available.
//
// The fallback is the important part: losing your voice mid-conversation
// because an optional model failed to load is the worst failure this app can
// have, so an unavailable or throwing backend silently drops back to the
// platform voice rather than producing silence.
export class TtsRouter {
  private backends = new Map<TtsBackendId, TtsBackend>()
  private preferred: TtsBackendId = 'platform'
  private warmedUp = false
  private defaults: SpeakOptions = {}
  private lastFallbackReason: string | null = null

  constructor(backends: TtsBackend[] = []) {
    for (const backend of backends) this.backends.set(backend.id, backend)
  }

  register(backend: TtsBackend): void {
    this.backends.set(backend.id, backend)
  }

  /** Which backend a request would actually use right now. */
  activeBackendId(): TtsBackendId {
    const preferred = this.backends.get(this.preferred)
    if (preferred?.isAvailable()) return preferred.id
    return 'platform'
  }

  /** Prefer a backend; falls back per-utterance if it is not available. */
  setPreferredBackend(id: TtsBackendId): void {
    this.preferred = id
  }

  /** Why the preferred backend was last skipped, for Settings to surface. */
  fallbackReason(): string | null {
    return this.lastFallbackReason
  }

  // Called whenever the active profile loads/changes — speak() then uses
  // the profile's voice/rate/pitch/volume unless overridden per call
  configure(defaults: SpeakOptions): void {
    this.defaults = defaults
  }

  async init(): Promise<void> {
    await platformBackend.init()
  }

  warmUp(): void {
    if (this.warmedUp) return
    this.warmedUp = true
    platformBackend.warmUp()
  }

  speak(text: string, options: SpeakOptions = {}): void {
    const merged = { ...this.defaults, ...options }
    const request = { ...merged, text }

    const preferred = this.backends.get(this.preferred)
    if (preferred && preferred.id !== 'platform') {
      if (preferred.isAvailable()) {
        try {
          this.lastFallbackReason = null
          preferred.speak({
            ...request,
            // A backend that fails mid-utterance must not end in silence.
            onError: (error) => {
              this.lastFallbackReason = error.message
              this.speakOnPlatform(request)
            },
          })
          return
        } catch (error) {
          this.lastFallbackReason =
            error instanceof Error ? error.message : String(error)
        }
      } else {
        this.lastFallbackReason = 'Enhanced voice is not ready yet.'
      }
    }

    this.speakOnPlatform(request)
  }

  private speakOnPlatform(request: SpeakOptions & { text: string }): void {
    platformBackend.speak(request)
  }

  stop(): void {
    for (const backend of this.backends.values()) backend.stop()
  }

  getVoices(): Speech.Voice[] {
    return platformBackend.getVoices()
  }

  // Best valid voice id for a language, or undefined if none loaded yet.
  bestVoiceId(language: string): string | undefined {
    return platformBackend.bestVoiceId(language)
  }

  // Is this stored id still a good, present, non-novelty voice?
  isValidVoiceId(id: string | undefined): boolean {
    return platformBackend.isValidVoiceId(id)
  }
}

export const ttsService = new TtsRouter([platformBackend, enhancedBackend])
export { enhancedBackend }
