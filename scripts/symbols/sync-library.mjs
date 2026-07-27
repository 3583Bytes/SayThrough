// Copies the downloaded full library into public/symbols/ for local
// full-catalog testing and pre-deploy builds, then rebuilds the search
// index. public/symbols/ is gitignored beyond the committed seed subset.
//
// Usage: node scripts/symbols/sync-library.mjs

import { cp } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')

await cp(join(here, 'data', 'library', 'arasaac'), join(root, 'public', 'symbols', 'arasaac'), {
  recursive: true,
})
console.log('library synced into public/symbols/')

execFileSync('node', [join(here, 'build-symbol-index.mjs')], { stdio: 'inherit' })
