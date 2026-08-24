// §10 TTS backends. Every utterance in the app goes through ttsService, so
// this interface is the one seam a different synthesiser has to fit through.
//
// The contract is deliberately fire-and-forget (speak returns void) because
// the call sites — a button press, a scan highlight — cannot await. Backends
// that need async work do it internally and report through the callbacks.

export type TtsBackendId = 'platform' | 'enhanced'

export interface SpeakRequest {
  text: string
  voiceId?: string
  language?: string
  rate?: number
  pitch?: number
  volume?: number
  onStart?: () => void
  onDone?: () => void
  onStopped?: () => void
  onError?: (error: Error) => void
  /** Fired as each word is reached, for word-by-word highlight (§Tier-1). */
  onBoundary?: (charIndex: number) => void
}

export interface TtsBackend {
  readonly id: TtsBackendId
  /** Prepare the backend. Must not throw; resolve false when unusable. */
  init(): Promise<boolean>
  /** Can it speak right now? Checked before every utterance. */
  isAvailable(): boolean
  speak(request: SpeakRequest): void
  stop(): void
}
