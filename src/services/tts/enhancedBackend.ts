import type { SpeakRequest, TtsBackend } from './types'

// §10.5 enhanced neural voice — native placeholder.
//
// The real implementation is enhancedBackend.web.ts. Piper here runs on
// onnxruntime-web plus an emscripten phonemizer, both browser-only; native
// builds (Phase 2) will bind the ONNX runtime through a native module
// instead. Until then this reports unavailable, so ttsService keeps using the
// platform voice — which on iOS and Android is already a decent one.

class EnhancedBackendStub implements TtsBackend {
  readonly id = 'enhanced' as const
  // Signature matches enhancedBackend.web.ts so callers typecheck against
  // either platform's implementation.
  async init(_onProgress?: (loaded: number, total: number) => void): Promise<boolean> {
    return false
  }
  isAvailable(): boolean {
    return false
  }
  speak(_request: SpeakRequest): void {
    throw new Error('Enhanced voice is not available on this platform.')
  }
  stop(): void {}
  /** Bytes fetched so far / total, for the Settings download UI. */
  downloadProgress(): { loaded: number; total: number } | null {
    return null
  }
  lastError(): string | null {
    return 'The enhanced voice is not available on this platform.'
  }

  isDownloaded(): Promise<boolean> {
    return Promise.resolve(false)
  }
}

export const enhancedBackend = new EnhancedBackendStub()
