// §10.2 default voice selection. Browsers expose EVERY OS voice through
// speechSynthesis — on macOS that includes ~25 novelty voices ("Albert",
// "Zarvox", "Bubbles") that sound like broken robots, and with no voice
// specified the browser can pick one of them. This module ranks voices so
// the app always starts with the best available and the Settings picker
// hides the junk. Pure functions — unit-testable without a browser.

export interface RankableVoice {
  identifier: string
  name: string
  language?: string
  quality?: string // expo-speech: 'Default' | 'Enhanced'
  localService?: boolean // web only; network voices fail offline
}

// macOS novelty/legacy voices — never offer these for AAC speech
const NOVELTY_NAMES = new Set(
  [
    'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos',
    'deranged', 'fred', 'good news', 'hysterical', 'jester', 'junior',
    'kathy', 'organ', 'pipe organ', 'ralph', 'superstar', 'trinoids',
    'whisper', 'wobble', 'zarvox', 'grandma', 'grandpa', 'rocko',
    'shelley', 'eddy', 'flo', 'reed', 'sandy',
  ],
)

// Known high-quality voices, best first (checked as name prefixes). Keyed by
// language: the English list scores nothing on a Spanish device, which would
// leave a Spanish user with an arbitrary pick from whatever the OS reports.
const KNOWN_GOOD: Record<string, string[]> = {
  en: [
    'samantha', 'ava', 'allison', 'susan', 'zoe', 'alex', 'karen',
    'daniel', 'moira', 'serena', 'tessa', 'google us english',
    'google uk english',
  ],
  // Apple's Mónica/Paulina and Google's español voices are the good ones;
  // Jorge and Diego are the older, more robotic Apple pair.
  es: [
    'mónica', 'monica', 'paulina', 'marisol', 'juan', 'google español',
    'google español de estados unidos', 'helena', 'laura', 'jorge', 'diego',
  ],
  // Zosia is Apple's Polish voice; Zofia/Marek are the Microsoft pair and
  // Agnieszka/Ewa/Jacek the older SAPI set.
  pl: [
    'zosia', 'google polski', 'zofia', 'paulina', 'marek', 'agnieszka',
    'ewa', 'maja', 'jacek', 'jan', 'krzysztof',
  ],
  // Luciana is Apple's pt-BR voice; Joana is pt-PT and ranks below it because
  // the bundled boards are Brazilian.
  pt: [
    'luciana', 'google português do brasil', 'google português',
    'francisca', 'felipe', 'joana', 'catarina', 'raquel', 'daniel',
  ],
}

export function isNoveltyVoice(voice: RankableVoice): boolean {
  const name = voice.name.toLowerCase().replace(/\s*\(.*\)$/, '').trim()
  return NOVELTY_NAMES.has(name)
}

function score(voice: RankableVoice, lang: string): number {
  const name = voice.name.toLowerCase()
  let points = 0
  // Neural/natural voices (Edge exposes "... Online (Natural)") are best
  if (name.includes('natural') || name.includes('neural')) points += 40
  const known = KNOWN_GOOD[lang] ?? KNOWN_GOOD.en
  const goodIndex = known.findIndex((good) => name.startsWith(good))
  if (goodIndex >= 0) points += 30 - goodIndex // earlier in list = better
  if (voice.quality?.toLowerCase() === 'enhanced') points += 8
  // §10.2: local voices work offline and have no network latency —
  // meaningful tiebreak, but never outranks a known-good voice
  if (voice.localService) points += 4
  return points
}

export function rankVoices<T extends RankableVoice>(
  voices: T[],
  language: string,
): T[] {
  const langPrefix = language.slice(0, 2).toLowerCase()
  return voices
    .filter((voice) => voice.language?.toLowerCase().startsWith(langPrefix))
    .filter((voice) => !isNoveltyVoice(voice))
    .sort(
      (a, b) =>
        score(b, langPrefix) - score(a, langPrefix) ||
        a.name.localeCompare(b.name),
    )
}

export function pickDefaultVoice<T extends RankableVoice>(
  voices: T[],
  language: string,
): T | undefined {
  return rankVoices(voices, language)[0]
}

// The voice id to actually SPEAK with. expo-speech-web falls back to
// voices[0] (often a robotic voice) when the requested id matches no
// voiceURI, so we must only ever hand it an id we know is present and
// non-novelty. If the requested id is missing/stale/novelty we
// substitute the best available voice; if nothing is loaded we return
// undefined so the OS default is used instead of voices[0].
export function resolveVoiceId(
  voices: RankableVoice[],
  requested: string | undefined,
  language: string,
): string | undefined {
  if (voices.length === 0) return undefined
  const match = requested ? voices.find((v) => v.identifier === requested) : undefined
  if (match && !isNoveltyVoice(match)) return match.identifier
  return pickDefaultVoice(voices, language)?.identifier
}

export function isValidVoiceId(
  voices: RankableVoice[],
  id: string | undefined,
): boolean {
  if (!id || voices.length === 0) return false
  const v = voices.find((x) => x.identifier === id)
  return !!v && !isNoveltyVoice(v)
}
