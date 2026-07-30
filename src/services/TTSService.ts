import * as Speech from 'expo-speech'
import {
  isValidVoiceId,
  pickDefaultVoice,
  resolveVoiceId,
} from './voiceSelection'

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
  // the offset into `text`; available on web + native via expo-speech.
  onBoundary?: (charIndex: number) => void
}

// technical-specification.md §10.1 / §10.4
class TTSService {
  private warmedUp = false
  private voices: Speech.Voice[] = []
  private defaults: SpeakOptions = {}

  // Called whenever the active profile loads/changes — speak() then uses
  // the profile's voice/rate/pitch/volume unless overridden per call
  configure(defaults: SpeakOptions): void {
    this.defaults = defaults
  }

  // §10.4: force the voice list to load at startup. On web it arrives
  // asynchronously (voiceschanged) and the first call often returns [],
  // so retry briefly; also subscribe to voiceschanged so late-arriving
  // voices are captured after init gives up.
  async init(): Promise<void> {
    for (let attempt = 0; attempt < 12 && this.voices.length === 0; attempt++) {
      try {
        this.voices = await Speech.getAvailableVoicesAsync()
      } catch {
        this.voices = []
      }
      if (this.voices.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        Speech.getAvailableVoicesAsync()
          .then((v) => {
            if (v.length) this.voices = v
          })
          .catch(() => {})
      }
    }
  }

  // §10.4: engines have first-utterance latency of up to ~1s; a silent
  // utterance on the first user interaction absorbs it before the first
  // real word
  warmUp(): void {
    if (this.warmedUp) return
    this.warmedUp = true
    Speech.speak(' ', { volume: 0 })
  }

  // Resolve to a voice id we KNOW is present and non-novelty. This is
  // the crux fix: expo-speech-web falls back to voices[0] (often a
  // robotic voice) when the requested id doesn't match any voiceURI, so
  // we must never hand it a stale/invalid id. If the requested id is bad
  // we substitute the best available voice; if we can't, we return
  // undefined so expo-speech uses the OS default instead of voices[0].
  speak(text: string, options: SpeakOptions = {}): void {
    const o = { ...this.defaults, ...options }
    const language = o.language ?? 'en-US'
    Speech.stop()
    Speech.speak(text, {
      voice: resolveVoiceId(this.voices, o.voiceId, language),
      language,
      rate: o.rate ?? 0.9,
      pitch: o.pitch ?? 1.0,
      volume: o.volume ?? 1.0,
      onStart: o.onStart,
      onDone: o.onDone,
      onStopped: o.onStopped,
      onError: o.onError,
      onBoundary: o.onBoundary
        ? (ev: { charIndex: number }) => o.onBoundary?.(ev.charIndex)
        : undefined,
    })
  }

  stop(): void {
    Speech.stop()
  }

  getVoices(): Speech.Voice[] {
    return this.voices
  }

  // Best valid voice id for a language, or undefined if none loaded yet.
  bestVoiceId(language: string): string | undefined {
    return pickDefaultVoice(this.voices, language)?.identifier
  }

  // Is this stored id still a good, present, non-novelty voice?
  isValidVoiceId(id: string | undefined): boolean {
    return isValidVoiceId(this.voices, id)
  }
}

export const ttsService = new TTSService()
