// §9.1 step 6 — builds the app-facing symbol search index from whatever
// symbols are actually hosted in public/symbols/. Run after any symbol
// build step; the picker catalog grows automatically when the full
// library lands.
// Output: public/symbolIndex.json  [{ id, library, keywords[] }]

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const symbolsDir = join(root, 'public', 'symbols')

const arasaacIndex = JSON.parse(
  await readFile(join(here, 'data', 'arasaac-index-en.json'), 'utf8'),
)
const byId = new Map(arasaacIndex.map((picto) => [String(picto._id), picto]))

const entries = []
for (const library of await readdir(symbolsDir)) {
  const files = await readdir(join(symbolsDir, library))
  for (const file of files) {
    const id = file.replace(/\.webp$/, '')
    if (library === 'arasaac') {
      const picto = byId.get(id)
      if (!picto) continue
      entries.push({
        id: `arasaac:${id}`,
        library,
        keywords: (picto.keywords ?? [])
          .map((k) => k.keyword)
          .filter(Boolean)
          .slice(0, 6),
      })
    } else {
      // mulberry etc. — filename is the keyword
      entries.push({ id: `${library}:${id}`, library, keywords: [id] })
    }
  }
}

entries.sort((a, b) => a.id.localeCompare(b.id))
await writeFile(
  join(root, 'public', 'symbolIndex.json'),
  JSON.stringify(entries),
)
console.log(`symbolIndex.json: ${entries.length} entries`)
