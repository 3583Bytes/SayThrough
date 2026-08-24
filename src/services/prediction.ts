// §18 word prediction. The ranking half of this file is pure and synchronous
// on purpose: keystroke handling cannot await, so the UI loads the lexicon
// once (loadLexicon) and then calls rankPredictions per keypress.
//
// Persistence of the personal model lives in predictionModel.ts; this file
// only knows how to rank with one and how to fold a message into one.

import seedBigramsJson from '../data/seedBigrams.json'

const BASE = process.env.EXPO_PUBLIC_BASE_URL ?? ''

const SEED_BIGRAMS = seedBigramsJson as unknown as Record<
  string,
  Record<string, string[]>
>

export type PredictionSource = 'abbreviation' | 'personal' | 'vocabulary' | 'base'

export interface Prediction {
  word: string
  source: PredictionSource
}

// §18.2 layer 2 — head → next → count, plus bare word counts.
export interface PersonalModel {
  unigrams: Record<string, number>
  bigrams: Record<string, Record<string, number>>
}

export const EMPTY_MODEL: PersonalModel = { unigrams: {}, bigrams: {} }

// §18.3 interpolation weights. Personal evidence outranks the corpus by
// design: what this user actually says beats what films say.
const W_PERSONAL_BIGRAM = 1.0
const W_SEED_BIGRAM = 0.5
const W_PERSONAL_UNIGRAM = 0.6
const W_VOCABULARY = 0.25
const W_BASE = 0.3

// Scan cap for the base lexicon. Personal and vocabulary candidates are small
// enough to enumerate fully, so capping here cannot hide a high-scoring
// personal word — it only bounds how many corpus words the blend may reorder.
const SCAN_FACTOR = 5

// Model caps (§18.2). Small enough that the whole thing stays a few KB.
const MAX_UNIGRAMS = 500
const MAX_BIGRAM_HEADS = 1000
const MAX_CONTINUATIONS = 8

export interface RankSources {
  lexicon: string[]
  personal?: PersonalModel
  /** The user's own button labels — a "grandma" button must beat corpus `gra…`. */
  vocabulary?: Iterable<string>
  language?: string
}

/** Lowercase, strip surrounding punctuation, keep internal apostrophes. */
export function normalizeWord(raw: string): string {
  return raw.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '')
}

/**
 * Re-apply the shape of what the user typed to a lowercase suggestion, so
 * typing "Wa" offers "Want" rather than "want".
 */
export function applyCaseOf(typed: string, word: string): string {
  if (!typed) return word
  if (typed === typed.toUpperCase() && typed.length > 1) return word.toUpperCase()
  if (typed[0] === typed[0].toUpperCase()) return word[0].toUpperCase() + word.slice(1)
  return word
}

function langCode(language: string | undefined): string {
  return (language ?? 'en').slice(0, 2).toLowerCase()
}

/**
 * §18.3 — merge the four ranked sources. Pure; no I/O, no module state beyond
 * the seed table, so the ranking is trivially unit-testable.
 */
export function rankPredictions(
  prefix: string,
  previousWord: string | undefined,
  sources: RankSources,
  limit = 4,
): Prediction[] {
  const typed = normalizeWord(prefix)
  const head = previousWord ? normalizeWord(previousWord) : undefined
  const { lexicon, personal, vocabulary } = sources

  const scores = new Map<string, number>()
  const origin = new Map<string, PredictionSource>()

  // Higher-priority sources keep their label when a word scores from several.
  const RANKED: PredictionSource[] = ['base', 'vocabulary', 'personal', 'abbreviation']
  const add = (word: string, score: number, source: PredictionSource) => {
    // Suggesting the word already fully typed is a no-op for the user.
    if (!word || word === typed) return
    if (typed && !word.startsWith(typed)) return
    // In next-word mode, never offer the word that just went in ("i i").
    if (!typed && word === head) return
    scores.set(word, (scores.get(word) ?? 0) + score)
    const current = origin.get(word)
    if (!current || RANKED.indexOf(source) > RANKED.indexOf(current)) {
      origin.set(word, source)
    }
  }

  // 1. What this user actually says after `head`.
  if (head && personal) {
    const continuations = personal.bigrams[head]
    if (continuations) {
      const max = Math.max(...Object.values(continuations), 1)
      for (const [word, count] of Object.entries(continuations)) {
        add(word, W_PERSONAL_BIGRAM * (count / max), 'personal')
      }
    }
  }

  // 2. Seeded AAC frames, so a fresh profile still sees sensible next words.
  if (head) {
    const seeded = SEED_BIGRAMS[langCode(sources.language)]?.[head]
    if (seeded) {
      // Tagged 'base', not 'personal' — these are shipped frames, and a UI
      // that marks the user's own words must not claim these are theirs.
      seeded.forEach((word, index) => {
        add(word, W_SEED_BIGRAM * ((seeded.length - index) / seeded.length), 'base')
      })
    }
  }

  // 3. This user's own words, regardless of what preceded them. Gated on a
  // prefix for the same reason as the base lexicon below: with nothing typed
  // these are context-free frequency, so they would crowd the genuine bigram
  // continuations out of the bar.
  if (typed && personal) {
    const counts = Object.values(personal.unigrams)
    if (counts.length) {
      const max = Math.max(...counts, 1)
      for (const [word, count] of Object.entries(personal.unigrams)) {
        add(word, W_PERSONAL_UNIGRAM * (count / max), 'personal')
      }
    }
  }

  // 4. Words already on their buttons — likewise prefix-gated.
  if (typed && vocabulary) {
    for (const label of vocabulary) {
      add(normalizeWord(label), W_VOCABULARY, 'vocabulary')
    }
  }

  // 5. Base lexicon. With no prefix this would return the same handful of
  // ultra-common words after every single tap ("you", "i", "the"), which is
  // noise rather than prediction — so next-word mode uses bigrams only.
  if (typed && lexicon.length) {
    const denominator = Math.log(lexicon.length + 1)
    let matched = 0
    for (let i = 0; i < lexicon.length && matched < limit * SCAN_FACTOR; i++) {
      const word = lexicon[i]
      if (!word.startsWith(typed)) continue
      matched++
      add(word, W_BASE * (1 - Math.log(i + 1) / denominator), 'base')
    }
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => ({ word, source: origin.get(word) ?? 'base' }))
}

/**
 * Fold a spoken message into the personal model, returning a new one.
 * Callers must skip this while modeling mode is active (§18.2) — an SLP
 * demonstrating on the device must not train the user's model.
 */
export function learn(model: PersonalModel, words: string[]): PersonalModel {
  const clean = words.map(normalizeWord).filter(Boolean)
  if (!clean.length) return model

  const unigrams = { ...model.unigrams }
  const bigrams: PersonalModel['bigrams'] = { ...model.bigrams }

  clean.forEach((word, index) => {
    unigrams[word] = (unigrams[word] ?? 0) + 1
    const next = clean[index + 1]
    if (!next) return
    bigrams[word] = { ...bigrams[word], [next]: (bigrams[word]?.[next] ?? 0) + 1 }
  })

  return age({ unigrams, bigrams })
}

/**
 * Keep the model bounded. Halving rather than evicting preserves relative
 * ordering while letting vocabulary the user has moved on from fade out.
 */
function age(model: PersonalModel): PersonalModel {
  let { unigrams, bigrams } = model

  if (Object.keys(unigrams).length > MAX_UNIGRAMS) {
    unigrams = Object.fromEntries(
      Object.entries(unigrams)
        .map(([word, count]) => [word, Math.floor(count / 2)] as const)
        .filter(([, count]) => count > 0),
    )
  }

  // Trim each head's continuations, then the heads themselves, keeping the
  // most-used of each.
  bigrams = Object.fromEntries(
    Object.entries(bigrams).map(([head, continuations]) => [
      head,
      Object.fromEntries(
        Object.entries(continuations)
          .sort((a, b) => b[1] - a[1])
          .slice(0, MAX_CONTINUATIONS),
      ),
    ]),
  )

  const heads = Object.keys(bigrams)
  if (heads.length > MAX_BIGRAM_HEADS) {
    const weight = (head: string) =>
      Object.values(bigrams[head]).reduce((sum, n) => sum + n, 0)
    bigrams = Object.fromEntries(
      heads
        .sort((a, b) => weight(b) - weight(a))
        .slice(0, MAX_BIGRAM_HEADS)
        .map((head) => [head, bigrams[head]]),
    )
  }

  return { unigrams, bigrams }
}

// ---------------------------------------------------------------------------
// Lexicon asset loading (§18.2 layer 1)

let lexicon: string[] = []
let loadedLang: string | null = null
let inFlight: Promise<string[]> | null = null

/**
 * Fetch and memoize the frequency-ordered lexicon. Mirrors symbolCatalog's
 * lazy same-origin fetch; the service worker caches it for offline use.
 * Degrades to an empty list — prediction goes quiet, the keyboard still types.
 */
export async function loadLexicon(language: string | undefined): Promise<string[]> {
  const code = langCode(language)
  if (loadedLang === code && lexicon.length) return lexicon
  if (loadedLang === code && inFlight) return inFlight

  loadedLang = code
  inFlight = fetch(`${BASE}/prediction/${code}.txt`)
    .then((response) => (response.ok ? response.text() : ''))
    .then((text) => {
      lexicon = text.split('\n').filter(Boolean)
      return lexicon
    })
    .catch(() => {
      // Leave loadedLang set but drop the promise so a later keystroke can
      // retry — a failure here is usually a first-run offline blip.
      inFlight = null
      return []
    })

  return inFlight
}

/** Prefetch at startup so the lexicon is cached before the keyboard opens. */
export function warmLexicon(language: string | undefined): void {
  void loadLexicon(language)
}

export function getLoadedLexicon(): string[] {
  return lexicon
}
