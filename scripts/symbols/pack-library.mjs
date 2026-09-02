// Packs the full symbol library + its search index into a tarball for
// distribution as a GitHub release asset (the library never lives in
// git — user decision, docs/technical-specification.md §9.4).
//
// Prereq: node scripts/symbols/download-all-symbols.mjs (completed)
// Usage:  node scripts/symbols/pack-library.mjs
// Then:   gh release create symbols-v1 --title "Symbol library v1" \
//           --notes "ARASAAC (CC BY-NC-SA 4.0) WebP library for deploys" \
//           scripts/symbols/data/saythrough-symbols.tar.gz

import { execFileSync } from 'node:child_process'
import { readdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildIndexes } from './build-symbol-index.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const libraryDir = join(here, 'data', 'library')
const outPath = join(here, 'data', 'saythrough-symbols.tar.gz')

const files = await readdir(join(libraryDir, 'arasaac'))
if (files.length < 10000) {
  console.error(`Only ${files.length} symbols present — run download-all-symbols.mjs first`)
  process.exit(1)
}

// Build the FULL per-language search indexes from what's actually in the
// library, shipped INSIDE the tar because CI can't rebuild them (the raw
// ARASAAC indexes are gitignored).
await buildIndexes(libraryDir, join(libraryDir, 'symbolIndex'))

execFileSync('tar', ['-czf', outPath, '-C', libraryDir, '.'], { stdio: 'inherit' })
const size = (await stat(outPath)).size
console.log(
  `Packed ${files.length} symbols + per-language indexes → ${outPath} (${(size / 1024 / 1024).toFixed(0)} MB)`,
)
