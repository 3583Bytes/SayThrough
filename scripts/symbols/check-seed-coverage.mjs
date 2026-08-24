// Guard: every symbol the bundled vocabulary references must have a COMMITTED
// image file.
//
// public/symbols/ is gitignored — the full library is synced locally and
// fetched from the symbols-v1 release in CI — so it is easy to add vocabulary,
// see it working locally against the full library, and ship a deploy where
// those symbols 404. That is exactly what happened: the seed subset was built
// for a 144-word vocabulary and never regenerated as it grew to 450, leaving
// 256 broken symbol buttons in production.
//
// Usage: node scripts/symbols/check-seed-coverage.mjs

import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const map = JSON.parse(await readFile(join(root, 'src', 'data', 'seedSymbolMap.json'), 'utf8'))

const tracked = new Set(
  execFileSync('git', ['ls-files', 'public/symbols'], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter((line) => line.endsWith('.webp'))
    .map((line) => line.split('/').pop().replace('.webp', '')),
)

const missing = []
for (const [label, ref] of Object.entries(map)) {
  const id = ref.split(':')[1]
  if (!tracked.has(id)) missing.push(`${label} (${ref})`)
}

const needed = new Set(Object.values(map).map((r) => r.split(':')[1]))
console.log(`seed coverage: ${needed.size - missing.length}/${needed.size} referenced symbols committed`)

if (missing.length) {
  console.error(
    `\n${missing.length} vocabulary labels reference a symbol with no committed file.\n` +
      `They will render as broken images on any deploy without the symbols-v1 release.\n` +
      `Fix: node scripts/symbols/build-seed-symbols.mjs, then\n` +
      `     git add -f public/symbols/arasaac/<id>.webp\n\n` +
      missing.slice(0, 20).map((m) => `  - ${m}`).join('\n') +
      (missing.length > 20 ? `\n  …and ${missing.length - 20} more` : ''),
  )
  process.exit(1)
}
