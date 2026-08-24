// §10.5 step 3 — copy the espeak-ng phonemizer (piper_phonemize) into public/
// so it too is served from our own origin.
//
// Piper models take PHONEME IDS, not text, so this is not optional: without a
// phonemizer the model cannot be driven at all.
//
// It is loaded as a static asset rather than bundled: piper_phonemize.js is
// emscripten glue that fetches its own .wasm and .data by URL at runtime, so
// bundling it would just fight the loader.
//
// Output: public/voice/ (gitignored — regenerated from node_modules)
// Usage:  node scripts/voice/build-phonemizer.mjs

import { copyFile, mkdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const src = join(root, 'node_modules', '@diffusionstudio', 'piper-wasm', 'build')
const out = join(root, 'public', 'voice')

// .data is espeak-ng's dictionaries — the bulk of the size, and required.
const FILES = ['piper_phonemize.js', 'piper_phonemize.wasm', 'piper_phonemize.data']

await mkdir(out, { recursive: true })
let total = 0
for (const file of FILES) {
  await copyFile(join(src, file), join(out, file))
  total += (await stat(join(out, file))).size
}
console.log(
  `phonemizer: ${FILES.length} files, ${(total / 1024 / 1024).toFixed(1)} MB → public/voice/`,
)
