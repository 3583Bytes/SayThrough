// Prediction pipeline step 2 — turn a raw frequency list into the app-facing
// lexicon asset. Run download-lexicon.mjs first.
//
// Output: public/prediction/{lang}.txt — one word per line, most frequent
// first, nothing else. The ORDER is the whole signal: prediction.ts scans
// from the top and takes the first K prefix matches, which are by definition
// the K most frequent matches, so counts never need to ship. That keeps the
// asset around 70 KB (~25 KB gzipped) instead of carrying a parallel count
// column nothing reads.
//
// Usage: node scripts/prediction/build-lexicon.mjs [lang] [size]

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const lang = process.argv[2] ?? 'en'
// 30k, not the 10k that covers ~95% of conversational English. Subtitle
// dialogue is verb- and pronoun-heavy, so it under-ranks concrete nouns —
// broccoli, giraffe, inhaler and trampoline all sit between rank 11k and 21k.
// Those are exactly the words someone reaches the keyboard for when they are
// not already on a button, so the tail is worth 80 KB.
const size = Number(process.argv[3] ?? 30000)

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const outDir = join(root, 'public', 'prediction')

const raw = await readFile(join(here, 'data', `${lang}_50k.txt`), 'utf8')
// Per-language blocklist: English keeps the original filename, every other
// language gets a suffixed file. Both must exist — silently falling back to
// the English list would let Spanish profanity straight through.
const blocklistFile = lang === 'en' ? 'blocklist.json' : `blocklist.${lang}.json`
const blocklist = JSON.parse(await readFile(join(here, blocklistFile), 'utf8'))
const contractions = JSON.parse(await readFile(join(here, 'contractions.json'), 'utf8'))

// Every non-underscore key is a category of blocked words; underscore keys are
// documentation. Exact match only — see blocklist.json for why.
const blocked = new Set(
  Object.entries(blocklist)
    .filter(([key]) => !key.startsWith('_'))
    .flatMap(([, words]) => words),
)

// Guard: a future over-broad blocklist edit must not silently strip the
// clinical and protective vocabulary we committed to keeping.
const mustKeep = Object.entries(blocklist._keptDeliberately)
  .filter(([key]) => !key.startsWith('_'))
  .flatMap(([, words]) => words)
const wronglyBlocked = mustKeep.filter((word) => blocked.has(word))
if (wronglyBlocked.length) {
  throw new Error(
    `blocklist.json blocks words listed under _keptDeliberately: ${wronglyBlocked.join(', ')}`,
  )
}

const langRules = contractions[lang] ?? { add: {}, dropRaw: [] }
const dropRaw = new Set(langRules.dropRaw ?? [])

// Letters, optionally joined by hyphens or apostrophes, with an optional
// trailing period for abbreviations (mr., st., no.). Everything else in the
// corpus is tokenizer debris: bare clitics ('s, 't), digits, stray dashes.
//
// The letter class is per-language. Spanish needs the accented vowels, ñ and
// ü, or the filter would silently drop `está`, `niño`, `qué` and `también` —
// four of the commonest words in the language — and leave the lexicon looking
// plausible while missing its most useful entries. Polish needs the full
// ogonek/kreska/dot set (ą ć ę ł ń ó ś ź ż) for the same reason: without it
// `się`, `już`, `jesteś` and `wszystko` all disappear.
const LETTERS = { en: 'a-z', es: 'a-záéíóúüñ', pl: 'a-ząćęłńóśźż', pt: 'a-záéíóúâêôãõàç' }
const letters = LETTERS[lang] ?? LETTERS.en
const SHAPE = new RegExp(`^[${letters}]+(?:[-'][${letters}]+)*\\.?$`)

function isJunk(word) {
  if (!SHAPE.test(word)) return true

  // "i." and "a." are sentence-splitter debris; "mr." and "st." are words.
  const core = word.endsWith('.') ? word.slice(0, -1) : word
  if (core.length === 1 && core !== 'a' && core !== 'i') return true

  // Stuttered dialogue ("i-i", "t-t") vs. real reduplication ("bye-bye").
  const parts = core.split('-')
  if (parts.length > 1) {
    const allSame = parts.every((p) => p === parts[0])
    if (allSame && parts[0].length <= 2) return true
  }

  return false
}

const entries = []
const seen = new Set()
let droppedJunk = 0
let droppedBlocked = 0
let droppedMisspelled = 0

for (const line of raw.split('\n')) {
  const [word, countText] = line.trim().split(/\s+/)
  if (!word || !countText) continue
  const lower = word.toLowerCase()
  const count = Number(countText)
  if (!Number.isFinite(count)) continue

  if (isJunk(lower)) { droppedJunk++; continue }
  if (blocked.has(lower)) { droppedBlocked++; continue }
  if (dropRaw.has(lower)) { droppedMisspelled++; continue }
  if (seen.has(lower)) continue

  seen.add(lower)
  entries.push([lower, count])
}

// Contractions are absent from the corpus entirely (it splits them into
// clitics), so they are added rather than reweighted.
for (const [word, count] of Object.entries(langRules.add ?? {})) {
  if (blocked.has(word)) continue
  if (seen.has(word)) continue
  seen.add(word)
  entries.push([word, count])
}

entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
const lexicon = entries.slice(0, size).map(([word]) => word)

// Film dialogue barely mentions menstruation, catheters or puberty, so the
// corpus systematically under-represents exactly the personal-care and
// protective vocabulary this user group needs most. Append whatever fell
// outside the cut rather than letting that bias through. Appending puts them
// last, which is the behavior we want: reachable once the user has typed
// enough to mean them, never suggested out of nowhere.
const included = new Set(lexicon)
const restored = mustKeep.filter((word) => !included.has(word))
lexicon.push(...restored)

await mkdir(outDir, { recursive: true })
await writeFile(join(outDir, `${lang}.txt`), lexicon.join('\n') + '\n')
await writeFile(
  join(outDir, 'ATTRIBUTION.txt'),
  [
    'Word-frequency lexicons in this folder are derived from FrequencyWords',
    '(https://github.com/hermitdave/FrequencyWords) by Hermit Dave, generated',
    'from the OpenSubtitles corpus and distributed under CC BY-SA 4.0.',
    '',
    'SayThrough filters that data (profanity, slurs, tokenizer artifacts) and',
    'restores split contractions; the resulting lists remain CC BY-SA 4.0.',
    'See scripts/prediction/ for the build pipeline.',
    '',
  ].join('\n'),
)

console.log(`prediction/${lang}.txt: ${lexicon.length} words`)
console.log(
  `  dropped: ${droppedJunk} junk, ${droppedBlocked} blocked, ${droppedMisspelled} misspellings`,
)
console.log(`  added:   ${Object.keys(langRules.add ?? {}).length} contractions`)
if (restored.length) {
  console.log(
    `  restored: ${restored.length} _keptDeliberately words below the top ${size}: ${restored.join(', ')}`,
  )
}
