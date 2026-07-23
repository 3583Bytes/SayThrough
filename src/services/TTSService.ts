import * as Speech from 'expo-speech'

export interface SpeakOptions {
  voiceId?: string // platform voice identifier → Speech `voice`
  language?: string // BCP-47 tag → Speech `language`
  rate?: number
  pitch?: number
  volume?: number
  onStart?: () => void
  onDone?: () => void
  onError?: (error: Error) => void
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

  // §10.4: force the voice list to load at startup — on web it arrives
  // asynchronously and the first speak() would otherwise use a fallback
  async init(): Promise<void> {
    try {
      this.voices = await Speech.getAvailableVoicesAsync()
    } catch {
      this.voices = []
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

  speak(text: string, options: SpeakOptions = {}): void {
    const o = { ...this.defaults, ...options }
    Speech.stop()
    Speech.speak(text, {
      voice: o.voiceId,
      language: o.language ?? 'en-US',
      rate: o.rate ?? 0.9,
      pitch: o.pitch ?? 1.0,
      volume: o.volume ?? 1.0,
      onStart: o.onStart,
      onDone: o.onDone,
      onError: o.onError,
    })
  }

  stop(): void {
    Speech.stop()
  }

  getVoices(): Speech.Voice[] {
    return this.voices
  }
}

export const ttsService = new TTSService()
