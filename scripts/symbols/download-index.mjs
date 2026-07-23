// §9.1 step 1 — fetch the full ARASAAC pictogram index for a language.
// Output: scripts/symbols/data/arasaac-index-{lang}.json (gitignored, ~20 MB)
// Usage: node scripts/symbols/download-index.mjs [lang]

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const lang = process.argv[2] ?? 'en'
const dataDir = join(dirname(fileURLToPath(import.meta.url)), 'data')
const outPath = join(dataDir, `arasaac-index-${lang}.json`)

console.log(`Fetching ARASAAC index (${lang})…`)
const res = await fetch(`https://api.arasaac.org/api/pictograms/all/${lang}`)
if (!res.ok) throw new Error(`ARASAAC API returned ${res.status}`)
const index = await res.json()

await mkdir(dataDir, { recursive: true })
await writeFile(outPath, JSON.stringify(index))
console.log(`Wrote ${index.length} pictograms → ${outPath}`)
