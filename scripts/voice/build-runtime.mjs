// §10.5 step 1 — copy the ONNX Runtime Web assets into public/ so the
// enhanced voice runs entirely from our own origin.
//
// Two constraints drive this:
//   1. ZERO third-party requests (§9.1, same rule as symbols). School
//      filters block unlisted domains, so a voice that fetched its runtime
//      from a CDN would simply fail in the districts we are built for.
//      This is also why @diffusionstudio/vits-web could not be used: it
//      hardcodes cdnjs, jsdelivr and huggingface as exported consts.
//   2. SINGLE-THREADED only. ORT's threaded build needs SharedArrayBuffer,
//      which needs COOP/COEP response headers, which GitHub Pages cannot
//      set — the same limitation that put this app on IndexedDB instead of
//      expo-sqlite. Copying the threaded build would ship 9 MB that can
//      never load.
//
// Output: public/ort/ (gitignored — regenerated from node_modules)
// Usage:  node scripts/voice/build-runtime.mjs

import { copyFile, mkdir, readdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const src = join(root, 'node_modules', 'onnxruntime-web', 'dist')
const out = join(root, 'public', 'ort')

// Single-threaded wasm + its loader only. SIMD is fine (no headers needed).
const WANTED = /^ort-wasm(-simd)?\.(wasm|js|mjs)$/

await mkdir(out, { recursive: true })
const files = (await readdir(src)).filter((f) => WANTED.test(f))
if (files.length === 0) {
  throw new Error(`No single-threaded ORT assets in ${src} — is onnxruntime-web installed?`)
}

let total = 0
for (const file of files) {
  await copyFile(join(src, file), join(out, file))
  total += (await stat(join(out, file))).size
}
console.log(
  `ort runtime: ${files.length} files, ${(total / 1024 / 1024).toFixed(1)} MB → public/ort/`,
)
console.log(`  ${files.join(', ')}`)
