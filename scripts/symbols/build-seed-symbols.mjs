// §9.1 steps 2–4/6 for the seed vocabulary subset: map each seed word to
// an ARASAAC pictogram, download the 300px PNG, convert to WebP into
// public/symbols/arasaac/, and emit src/data/seedSymbolMap.json.
//
// The full-library run (all ~13,500 pictograms) reuses this shape but is
// deliberately separate — it's a long, rate-limited download and its
// output must NOT be committed to git (~165 MB). See scripts/symbols/README.md.
//
// Prereq: node scripts/symbols/download-index.mjs
// Usage:  node scripts/symbols/build-seed-symbols.mjs

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const indexPath = join(here, 'data', 'arasaac-index-en.json')
const outDir = join(root, 'public', 'symbols', 'arasaac')
const mapPath = join(root, 'src', 'data', 'seedSymbolMap.json')

const coreWords = JSON.parse(
  await readFile(join(root, 'src', 'data', 'coreWords.json'), 'utf8'),
)
const index = JSON.parse(await readFile(indexPath, 'utf8'))

// Hand-curated picks beat keyword matching (see symbol-overrides.json)
const overrides = JSON.parse(
  await readFile(join(here, 'symbol-overrides.json'), 'utf8'),
)

// Labels to map: core + every topic word + the topic names themselves
// (used on the home page's navigation buttons)
const labels = new Set()
for (const [label] of coreWords.core) labels.add(label)
for (const [topic, words] of Object.entries(coreWords.topics)) {
  labels.add(topic)
  for (const [label] of words) labels.add(label)
}

// keyword → pictogram ids, exact match, first-listed keyword wins ties.
// TODO(§19.5): symbol choices need the same SLP review as the word list.
const byKeyword = new Map()
for (const picto of index) {
  for (let k = 0; k < (picto.keywords?.length ?? 0); k++) {
    const keyword = picto.keywords[k]?.keyword?.toLowerCase()
    if (!keyword) continue
    const existing = byKeyword.get(keyword)
    // prefer pictograms where this is the FIRST keyword (primary meaning)
    if (!existing || (k === 0 && existing.rank > 0)) {
      byKeyword.set(keyword, { id: picto._id, rank: k })
    }
  }
}

await mkdir(outDir, { recursive: true })

const map = {}
const missing = []
for (const label of [...labels].sort()) {
  const overrideId = overrides[label.toLowerCase()]
  const hit =
    typeof overrideId === 'number'
      ? { id: overrideId, rank: -1 }
      : byKeyword.get(label.toLowerCase())
  if (!hit) {
    missing.push(label)
    continue
  }
  const url = `https://static.arasaac.org/pictograms/${hit.id}/${hit.id}_300.png`
  const res = await fetch(url)
  if (!res.ok) {
    missing.push(label)
    continue
  }
  const png = Buffer.from(await res.arrayBuffer())
  await sharp(png).webp({ quality: 80 }).toFile(join(outDir, `${hit.id}.webp`))
  map[label] = `arasaac:${hit.id}`
  process.stdout.write(`${label} → arasaac:${hit.id}\n`)
}

await writeFile(mapPath, JSON.stringify(map, null, 2) + '\n')
console.log(`\nMapped ${Object.keys(map).length}/${labels.size} labels → ${mapPath}`)
if (missing.length) {
  console.log(`No pictogram found (buttons stay text-only): ${missing.join(', ')}`)
}
