// Prediction pipeline step 1 — fetch a raw word-frequency list for a
// language. Source: hermitdave/FrequencyWords, derived from the
// OpenSubtitles corpus. Conversational register (film/TV dialogue), which
// matches how AAC users actually talk far better than a literary corpus.
// Generator code is MIT; the lists themselves are CC BY-SA 4.0 — see
// README.md in this folder for the attribution we ship.
//
// Output: scripts/prediction/data/{lang}_50k.txt (gitignored, ~700 KB)
// Usage:  node scripts/prediction/download-lexicon.mjs [lang]

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const lang = process.argv[2] ?? 'en'
const dataDir = join(dirname(fileURLToPath(import.meta.url)), 'data')
const outPath = join(dataDir, `${lang}_50k.txt`)
const url = `https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/${lang}/${lang}_50k.txt`

console.log(`Fetching frequency list (${lang})…`)
const res = await fetch(url)
if (!res.ok) throw new Error(`FrequencyWords returned ${res.status} for ${url}`)
const text = await res.text()

const lines = text.split('\n').filter(Boolean).length
if (lines < 1000) throw new Error(`Suspiciously short list: ${lines} lines`)

await mkdir(dataDir, { recursive: true })
await writeFile(outPath, text)
console.log(`Wrote ${lines} entries → ${outPath}`)
