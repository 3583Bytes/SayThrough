// Packs the full symbol library + its search index into a tarball for
// distribution as a GitHub release asset (the library never lives in
// git — user decision, docs/technical-specification.md §9.4).
// The full symbolIndex.json is built here and shipped INSIDE the tar
// because CI can't rebuild it (the raw ARASAAC index is gitignored).
//
// Prereq: node scripts/symbols/download-all-symbols.mjs (completed)
// Usage:  node scripts/symbols/pack-library.mjs
// Then:   gh release create symbols-v1 --title "Symbol library v1" \
//           --notes "ARASAAC (CC BY-NC-SA 4.0) WebP library for deploys" \
//           scripts/symbols/data/saythrough-symbols.tar.gz

import { execFileSync } from 'node:child_process'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const libraryDir = join(here, 'data', 'library')
const outPath = join(here, 'data', 'saythrough-symbols.tar.gz')

const files = await readdir(join(libraryDir, 'arasaac'))
if (files.length < 10000) {
  console.error(`Only ${files.length} symbols present — run download-all-symbols.mjs first`)
  process.exit(1)
}

// Build the FULL search index from what's actually in the library
const arasaacIndex = JSON.parse(
  await readFile(join(here, 'data', 'arasaac-index-en.json'), 'utf8'),
)
const byId = new Map(arasaacIndex.map((picto) => [String(picto._id), picto]))
const entries = []
for (const file of files) {
  const id = file.replace(/\.webp$/, '')
  const picto = byId.get(id)
  if (!picto) continue
  entries.push({
    id: `arasaac:${id}`,
    library: 'arasaac',
    keywords: (picto.keywords ?? [])
      .map((k) => k.keyword)
      .filter(Boolean)
      .slice(0, 6),
  })
}
entries.sort((a, b) => a.id.localeCompare(b.id))
await writeFile(join(libraryDir, 'symbolIndex.json'), JSON.stringify(entries))

execFileSync('tar', ['-czf', outPath, '-C', libraryDir, '.'], { stdio: 'inherit' })
const size = (await stat(outPath)).size
console.log(
  `Packed ${files.length} symbols + ${entries.length}-entry index → ${outPath} (${(size / 1024 / 1024).toFixed(0)} MB)`,
)
