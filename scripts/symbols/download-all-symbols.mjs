// §9.1 full-library run: download every ARASAAC pictogram at 300px and
// convert to WebP. Output goes to scripts/symbols/data/library/arasaac/
// (gitignored — the library ships as a GitHub release asset, never in
// git). Resumable: existing files are skipped. Polite to ARASAAC:
// limited concurrency + retry with backoff.
//
// Prereq: node scripts/symbols/download-index.mjs
// Usage:  node scripts/symbols/download-all-symbols.mjs

import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, 'data', 'library', 'arasaac')
const CONCURRENCY = 4

const index = JSON.parse(
  await readFile(join(here, 'data', 'arasaac-index-en.json'), 'utf8'),
)
await mkdir(outDir, { recursive: true })

const ids = index.map((picto) => picto._id)
let done = 0
let skipped = 0
let failed = 0

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function fetchWithRetry(url, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url)
      if (res.ok) return Buffer.from(await res.arrayBuffer())
      if (res.status === 404) return null // pictogram without 300px render
      throw new Error(`HTTP ${res.status}`)
    } catch (error) {
      if (attempt === attempts) throw error
      await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }
}

async function processOne(id) {
  const outPath = join(outDir, `${id}.webp`)
  if (await exists(outPath)) {
    skipped++
    return
  }
  try {
    const png = await fetchWithRetry(
      `https://static.arasaac.org/pictograms/${id}/${id}_300.png`,
    )
    if (!png) {
      failed++
      return
    }
    await sharp(png).webp({ quality: 80 }).toFile(outPath)
    done++
  } catch {
    failed++
  }
  if ((done + skipped + failed) % 250 === 0) {
    console.log(
      `progress: ${done + skipped + failed}/${ids.length} (new ${done}, skipped ${skipped}, failed ${failed})`,
    )
  }
}

const queue = [...ids]
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const id = queue.shift()
      await processOne(id)
    }
  }),
)

console.log(
  `DONE: ${done} downloaded, ${skipped} already present, ${failed} failed of ${ids.length}`,
)
await writeFile(
  join(here, 'data', 'library-download-report.json'),
  JSON.stringify({ total: ids.length, done, skipped, failed, finishedAt: new Date().toISOString() }),
)
