import { type LanguageCode, langCode } from '../../i18n'
import type { SpeakRequest, TtsBackend } from './types'

// §10.5 enhanced neural voice (Piper) — web implementation.
//
// Everything is same-origin (§9.1): the ONNX runtime, the espeak-ng
// phonemizer and the voice model are all served from our own build, never a
// CDN, because school filters block unlisted domains.
//
// Two measured facts shape this file:
//   1. ONE persistent InferenceSession. Session init is ~825 ms; synthesis is
//      then ~165 ms per second of audio (RTF ~0.16). Creating a session per
//      utterance — what @diffusionstudio/vits-web does — costs ~2-3 s and is
//      slower than realtime.
//   2. The phonemizer has no callable export, only a CLI main, and its
//      --input must be a JSON ARRAY. A bare object aborts with no message.

const BASE = process.env.EXPO_PUBLIC_BASE_URL ?? ''

// One Piper model and one espeak-ng phoneme voice per language (§19.7). Both
// are ~60 MB, so only the active language's model is ever fetched — a Spanish
// user never downloads the English one.
const VOICES: Record<LanguageCode, { model: string; espeak: string }> = {
  en: { model: 'en_US-hfc_female-medium', espeak: 'en-us' },
  es: { model: 'es_ES-sharvard-medium', espeak: 'es' },
}

// 0.8x speed — the setting this voice was validated at. The shipped model
// config says 1.0, which is noticeably too fast for AAC listeners.
const DEFAULT_LENGTH_SCALE = 1.25

// Synthesized audio is cached per (text, speed). AAC speech is extremely
// repetitive — core words and stock phrases repeat all day — so the common
// path becomes a cache hit and never touches the model at all.
const MAX_CACHED_CLIPS = 300

interface PiperConfig {
  audio: { sample_rate: number }
  inference: { noise_scale: number; length_scale: number; noise_w: number }
}

type OrtNamespace = typeof import('onnxruntime-web')

/** Load a classic script once; both vendored libraries are UMD globals. */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

class EnhancedBackend implements TtsBackend {
  readonly id = 'enhanced' as const

  private ort: OrtNamespace | null = null
  private session: import('onnxruntime-web').InferenceSession | null = null
  private config: PiperConfig | null = null
  private createPhonemizer: ((options: object) => Promise<any>) | null = null

  private ready = false
  private initPromise: Promise<boolean> | null = null
  private progress: { loaded: number; total: number } | null = null
  private error: string | null = null

  private audio: AudioContext | null = null
  private playing: AudioBufferSourceNode | null = null
  private cache = new Map<string, Float32Array>()
  // Which language the loaded session speaks. A session is built for one
  // model, so switching language means tearing it down and building another.
  private loaded: LanguageCode | null = null
  // espeak-ng voice for the loaded model; phonemes are language-specific, so
  // running Spanish text through the English phonemizer produces nonsense.
  private espeak = VOICES.en.espeak

  isAvailable(): boolean {
    return this.ready
  }

  /** The language the current session speaks, or null if none is loaded. */
  loadedLanguage(): LanguageCode | null {
    return this.loaded
  }

  downloadProgress(): { loaded: number; total: number } | null {
    return this.progress
  }

  /** Has the model already been fetched into the HTTP cache? */
  /** Why the last init failed, for Settings to show verbatim. */
  lastError(): string | null {
    return this.error
  }

  async isDownloaded(language?: string): Promise<boolean> {
    try {
      const cache = await caches.open('saythrough-v1')
      const voice = VOICES[langCode(language)]
      return Boolean(await cache.match(`${BASE}/voices/${voice.model}.onnx`))
    } catch {
      return false
    }
  }

  /**
   * Fetch the model and build the session. Safe to call repeatedly — the
   * in-flight promise is shared, so tapping "Download" twice does not start
   * two 60 MB downloads.
   */
  init(
    onProgress?: (loaded: number, total: number) => void,
    language?: string,
  ): Promise<boolean> {
    const wanted = langCode(language)
    // Already speaking this language — nothing to do. Already speaking a
    // DIFFERENT one — drop the session and build the new model's.
    if (this.ready && this.loaded === wanted) return Promise.resolve(true)
    if (this.ready && this.loaded !== wanted) this.reset()
    if (this.initPromise) return this.initPromise
    this.error = null
    this.initPromise = this.load(onProgress, wanted).catch((cause) => {
      this.error = cause instanceof Error ? cause.message : String(cause)
      // Leave the app on the platform voice; Settings surfaces the failure.
      this.initPromise = null
      return false
    })
    return this.initPromise
  }

  /** Drop the session so a different language's model can replace it. */
  private reset(): void {
    this.stop()
    this.session = null
    this.config = null
    this.ready = false
    this.loaded = null
    this.progress = null
    this.cache.clear() // clips are language-specific
  }

  private async load(
    onProgress?: (loaded: number, total: number) => void,
    language: LanguageCode = 'en',
  ): Promise<boolean> {
    const voice = VOICES[language]
    await Promise.all([
      loadScript(`${BASE}/ort/ort.wasm.min.js`),
      loadScript(`${BASE}/voice/piper_phonemize.js`),
    ])

    const ort = (globalThis as unknown as { ort?: OrtNamespace }).ort
    const phonemize = (globalThis as unknown as { createPiperPhonemize?: any })
      .createPiperPhonemize
    if (!ort || !phonemize) throw new Error('Voice runtime failed to load.')

    // Single-threaded only: the threaded build needs SharedArrayBuffer, which
    // needs COOP/COEP headers that static hosting cannot send.
    ort.env.wasm.numThreads = 1
    ort.env.wasm.wasmPaths = `${BASE}/ort/`
    this.ort = ort
    this.createPhonemizer = phonemize

    // "Not published to this deployment" is a different situation from a
    // broken download, and worth saying so rather than blaming the network.
    // A 404 is the obvious signal, but hosts that serve an SPA fallback answer
    // 200 with HTML instead — so the body is checked too, rather than letting
    // JSON.parse fail with something unreadable.
    const configResponse = await fetch(`${BASE}/voices/${voice.model}.onnx.json`)
    const missing = new Error('The enhanced voice is not available on this site yet.')
    if (configResponse.status === 404) throw missing
    if (!configResponse.ok) throw new Error('Could not load the voice settings.')
    const configText = await configResponse.text()
    if (configText.trimStart().startsWith('<')) throw missing
    try {
      this.config = JSON.parse(configText) as PiperConfig
    } catch {
      throw missing
    }

    const modelBytes = await this.fetchModel(voice.model, onProgress)
    this.session = await ort.InferenceSession.create(modelBytes, {
      executionProviders: ['wasm'],
    })
    this.espeak = voice.espeak
    this.loaded = language
    this.ready = true
    this.progress = null
    return true
  }

  /** Streamed so the 60 MB download can show real progress, not a spinner. */
  private async fetchModel(
    model: string,
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<Uint8Array> {
    const response = await fetch(`${BASE}/voices/${model}.onnx`)
    if (response.status === 404) {
      throw new Error('The enhanced voice is not available on this site yet.')
    }
    if (!response.ok || !response.body) throw new Error('Could not download the voice.')

    const total = Number(response.headers.get('content-length') ?? 0)
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let loaded = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.length
      this.progress = { loaded, total }
      onProgress?.(loaded, total)
    }

    const bytes = new Uint8Array(loaded)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.length
    }
    return bytes
  }

  private async phonemize(text: string): Promise<number[]> {
    if (!this.createPhonemizer) throw new Error('Phonemizer not loaded.')
    const lines: string[] = []
    const module = await this.createPhonemizer({
      print: (line: string) => lines.push(line),
      printErr: () => {},
      locateFile: (file: string) => `${BASE}/voice/${file}`,
      noInitialRun: true,
    })
    // The input MUST be a JSON array — a bare object aborts silently.
    module.callMain([
      '-l',
      this.espeak,
      '--input',
      JSON.stringify([{ text }]),
      '--espeak_data',
      '/espeak-ng-data',
    ])
    const ids: number[] = []
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line)
        if (Array.isArray(parsed.phoneme_ids)) ids.push(...parsed.phoneme_ids)
      } catch {
        // non-JSON chatter on stdout is not fatal
      }
    }
    if (ids.length === 0) throw new Error(`Could not pronounce "${text}".`)
    return ids
  }

  private async synthesize(text: string, lengthScale: number): Promise<Float32Array> {
    const key = `${lengthScale}|${text}`
    const cached = this.cache.get(key)
    if (cached) return cached

    const ort = this.ort
    const session = this.session
    const config = this.config
    if (!ort || !session || !config) throw new Error('Voice not ready.')

    const ids = await this.phonemize(text)
    const result = await session.run({
      input: new ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
      input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
      scales: new ort.Tensor(
        'float32',
        Float32Array.from([
          config.inference.noise_scale,
          lengthScale,
          config.inference.noise_w,
        ]),
        [3],
      ),
    })
    const samples = result[session.outputNames[0]].data as Float32Array

    if (this.cache.size >= MAX_CACHED_CLIPS) {
      // Oldest-first; Map preserves insertion order.
      const oldest = this.cache.keys().next().value
      if (oldest !== undefined) this.cache.delete(oldest)
    }
    this.cache.set(key, samples)
    return samples
  }

  speak(request: SpeakRequest): void {
    const text = request.text.trim()
    if (!text) {
      request.onDone?.()
      return
    }
    // A session speaks exactly one language. Asked for another, report the
    // error rather than synthesising: the router then falls back to the
    // platform voice for this utterance, which is right — a Spanish sentence
    // read by the English model is worse than a plain Spanish system voice.
    if (request.language && langCode(request.language) !== this.loaded) {
      request.onError?.(
        new Error('The enhanced voice is not loaded for this language.'),
      )
      return
    }
    // rate is the platform 0.1–2.0 scale; Piper's length_scale is inverse.
    const rate = request.rate ?? 0.9
    const lengthScale = DEFAULT_LENGTH_SCALE * (0.9 / Math.max(rate, 0.1))

    void this.synthesize(text, Number(lengthScale.toFixed(3)))
      .then((samples) => this.play(samples, text, request))
      .catch((error) => {
        request.onError?.(
          error instanceof Error ? error : new Error(String(error)),
        )
      })
  }

  private play(samples: Float32Array, text: string, request: SpeakRequest): void {
    const config = this.config
    if (!config) throw new Error('Voice not ready.')

    this.audio = this.audio ?? new AudioContext()
    this.stop()

    const buffer = this.audio.createBuffer(1, samples.length, config.audio.sample_rate)
    // Copy rather than pass through: the tensor's view may be backed by
    // wasm memory, which copyToChannel will not accept.
    buffer.copyToChannel(new Float32Array(samples), 0)
    const source = this.audio.createBufferSource()
    source.buffer = buffer

    const gain = this.audio.createGain()
    gain.gain.value = request.volume ?? 1
    source.connect(gain).connect(this.audio.destination)

    this.playing = source
    request.onStart?.()

    // Neural synthesis emits no boundary events, so word-by-word highlight
    // (§Tier-1) gets them derived: each token is given a share of the clip
    // proportional to its length. Approximate, but it tracks closely enough
    // to read along with, and the alternative is losing the feature.
    const timers = request.onBoundary
      ? scheduleBoundaries(text, buffer.duration, request.onBoundary)
      : []

    source.onended = () => {
      for (const timer of timers) clearTimeout(timer)
      if (this.playing === source) {
        this.playing = null
        request.onDone?.()
      } else {
        request.onStopped?.()
      }
    }
    source.start()
  }

  stop(): void {
    const source = this.playing
    this.playing = null
    if (source) {
      try {
        source.stop()
      } catch {
        // already ended
      }
    }
  }
}

/** Character-proportional boundary estimate; exported for testing. */
export function boundaryOffsets(text: string, duration: number): Array<[number, number]> {
  const tokens: Array<{ index: number; length: number }> = []
  const pattern = /\S+/g
  let match: RegExpExecArray | null
  let totalChars = 0
  while ((match = pattern.exec(text))) {
    tokens.push({ index: match.index, length: match[0].length })
    totalChars += match[0].length
  }
  if (!tokens.length || totalChars === 0) return []

  let elapsed = 0
  return tokens.map((token) => {
    const at = elapsed
    elapsed += (token.length / totalChars) * duration
    return [token.index, at] as [number, number]
  })
}

function scheduleBoundaries(
  text: string,
  duration: number,
  onBoundary: (charIndex: number) => void,
): number[] {
  return boundaryOffsets(text, duration).map(([charIndex, at]) =>
    setTimeout(() => onBoundary(charIndex), at * 1000) as unknown as number,
  )
}

export const enhancedBackend = new EnhancedBackend()
