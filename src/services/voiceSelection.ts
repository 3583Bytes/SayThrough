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

// Known high-quality voices, best first (checked as name prefixes)
const KNOWN_GOOD = [
  'samantha', 'ava', 'allison', 'susan', 'zoe', 'alex', 'karen',
  'daniel', 'moira', 'serena', 'tessa', 'google us english',
  'google uk english',
]

export function isNoveltyVoice(voice: RankableVoice): boolean {
  const name = voice.name.toLowerCase().replace(/\s*\(.*\)$/, '').trim()
  return NOVELTY_NAMES.has(name)
}

function score(voice: RankableVoice): number {
  const name = voice.name.toLowerCase()
  let points = 0
  // Neural/natural voices (Edge exposes "... Online (Natural)") are best
  if (name.includes('natural') || name.includes('neural')) points += 40
  const goodIndex = KNOWN_GOOD.findIndex((good) => name.startsWith(good))
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
    .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
}

export function pickDefaultVoice<T extends RankableVoice>(
  voices: T[],
  language: string,
): T | undefined {
  return rankVoices(voices, language)[0]
}
