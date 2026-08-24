import * as Speech from 'expo-speech'
import { isValidVoiceId, pickDefaultVoice, resolveVoiceId } from '../voiceSelection'
import type { SpeakRequest, TtsBackend } from './types'

// The OS/browser synthesiser (AVSpeechSynthesizer, Android TTS, Web Speech).
// Always available, always the fallback — an AAC user must never be left
// without a voice because an optional enhanced engine failed to load.
class PlatformBackend implements TtsBackend {
  readonly id = 'platform' as const
  private voices: Speech.Voice[] = []

  // §10.4: force the voice list to load at startup. On web it arrives
  // asynchronously (voiceschanged) and the first call often returns [],
  // so retry briefly; also subscribe to voiceschanged so late-arriving
  // voices are captured after init gives up.
  async init(): Promise<boolean> {
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
    return true
  }

  isAvailable(): boolean {
    return true
  }

  // Resolve to a voice id we KNOW is present and non-novelty. This is
  // the crux fix: expo-speech-web falls back to voices[0] (often a
  // robotic voice) when the requested id doesn't match any voiceURI, so
  // we must never hand it a stale/invalid id.
  speak(request: SpeakRequest): void {
    const language = request.language ?? 'en-US'
    Speech.stop()
    Speech.speak(request.text, {
      voice: resolveVoiceId(this.voices, request.voiceId, language),
      language,
      rate: request.rate ?? 0.9,
      pitch: request.pitch ?? 1.0,
      volume: request.volume ?? 1.0,
      onStart: request.onStart,
      onDone: request.onDone,
      onStopped: request.onStopped,
      onError: request.onError,
      onBoundary: request.onBoundary
        ? (event: { charIndex: number }) => request.onBoundary?.(event.charIndex)
        : undefined,
    })
  }

  stop(): void {
    Speech.stop()
  }

  // §10.4: engines have first-utterance latency of up to ~1s; a silent
  // utterance on the first user interaction absorbs it before the first
  // real word.
  warmUp(): void {
    Speech.speak(' ', { volume: 0 })
  }

  getVoices(): Speech.Voice[] {
    return this.voices
  }

  bestVoiceId(language: string): string | undefined {
    return pickDefaultVoice(this.voices, language)?.identifier
  }

  isValidVoiceId(id: string | undefined): boolean {
    return isValidVoiceId(this.voices, id)
  }
}

export const platformBackend = new PlatformBackend()
