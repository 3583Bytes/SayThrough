// §9.1 step 6 — builds the app-facing symbol search indexes from whatever
// symbols are actually hosted. Run after any symbol build step; the picker
// catalog grows automatically when the full library lands.
//
// ONE INDEX PER LANGUAGE (§19.7). The pictograms are language-neutral
// images, but their keywords are not: a Polish caregiver customising a board
// used to have to guess the English word to find a symbol, which quietly
// undid the whole point of shipping localised boards. Each language gets its
// own file so a device downloads ~1 MB for its own language rather than 4 MB
// for everyone's, mirroring how the prediction lexicons ship.
//
// Output: {outDir}/{lang}.json  [{ id, library, keywords[] }]
// CLI:    node scripts/symbols/build-symbol-index.mjs
//         → public/symbols/ → public/symbolIndex/

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')

// App language code → ARASAAC locale. They differ in exactly one place:
// ARASAAC splits Portuguese into `pt` (European) and `br` (Brazilian), and
// SayThrough's Portuguese board is Brazilian throughout — pt-BR lexicon,
// pt_BR-faber voice, `você` taking the third person. Asking ARASAAC for `pt`
// would label the picker in the wrong Portuguese.
export const LOCALES = { en: 'en', es: 'es', pl: 'pl', pt: 'br' }

const FALLBACK = 'en' // keywords used when a pictogram has none in a language
const MAX_KEYWORDS = 6

async function loadArasaac(locale) {
  const path = join(here, 'data', `arasaac-index-${locale}.json`)
  const raw = await readFile(path, 'utf8').catch(() => {
    throw new Error(
      `Missing ${path} — run: node scripts/symbols/download-index.mjs ${locale}`,
    )
  })
  const byId = new Map()
  for (const picto of JSON.parse(raw)) {
    byId.set(
      String(picto._id),
      (picto.keywords ?? [])
        .map((k) => k.keyword)
        .filter(Boolean)
        .slice(0, MAX_KEYWORDS),
    )
  }
  return byId
}

// Locally-authored keywords for pictograms ARASAAC has not translated.
// ARASAAC ALWAYS WINS: an override is consulted only where upstream has no
// keyword for that pictogram in that language, so each entry retires itself
// the moment the translation lands upstream. Nothing here can shadow real
// ARASAAC data, which is what keeps the file safe to leave in place.
async function loadOverrides(lang) {
  const path = join(here, `keyword-overrides.${lang}.json`)
  const raw = await readFile(path, 'utf8').catch(() => null)
  if (!raw) return new Map()
  const json = JSON.parse(raw)
  const map = new Map()
  for (const [id, words] of Object.entries(json)) {
    if (id.startsWith('_')) continue // _comment, _pendingVerification, …
    const list = (Array.isArray(words) ? words : [words]).filter(Boolean)
    if (list.length) map.set(id, list.slice(0, MAX_KEYWORDS))
  }
  return map
}

/**
 * @param symbolsDir directory of `{library}/{id}.webp` — the source of truth
 *   for WHAT exists; the ARASAAC index only supplies keywords for it.
 */
export async function buildIndexes(symbolsDir, outDir) {
  const hosted = []
  for (const entry of await readdir(symbolsDir, { withFileTypes: true })) {
    // Directories only, and never the index output itself — pack-library
    // writes its indexes inside the library it just scanned, so a second run
    // would otherwise pick up `symbolIndex` as a symbol library.
    if (!entry.isDirectory()) continue
    const dir = join(symbolsDir, entry.name)
    if (dir === outDir) continue
    for (const file of await readdir(dir)) {
      if (!file.endsWith('.webp')) continue
      hosted.push({ library: entry.name, id: file.replace(/\.webp$/, '') })
    }
  }

  const fallbackKeywords = await loadArasaac(LOCALES[FALLBACK])
  await mkdir(outDir, { recursive: true })

  for (const [lang, locale] of Object.entries(LOCALES)) {
    const keywords =
      locale === LOCALES[FALLBACK] ? fallbackKeywords : await loadArasaac(locale)

    const overrides = await loadOverrides(lang)
    const unusedOverrides = new Set(overrides.keys())

    const entries = []
    let borrowed = 0
    let authored = 0
    let superseded = 0
    for (const { library, id } of hosted) {
      if (library !== 'arasaac') {
        // mulberry etc. — filename is the keyword, and it is not translated
        entries.push({ id: `${library}:${id}`, library, keywords: [id] })
        continue
      }
      let words = keywords.get(id)
      if (!words) continue // not in the ARASAAC index at all — skip everywhere
      if (words.length) {
        // Upstream has it. If we also carry an override, upstream wins and
        // the override is dead weight worth reporting.
        if (unusedOverrides.delete(id)) superseded++
      } else if (overrides.has(id)) {
        words = overrides.get(id)
        unusedOverrides.delete(id)
        authored++
      } else {
        // ARASAAC's per-language coverage is not complete (Polish sits ~92%).
        // Borrowing English keeps the symbol findable rather than invisible;
        // an English label in the picker beats a picture nobody can reach.
        words = fallbackKeywords.get(id) ?? []
        if (words.length) borrowed++
      }
      if (words.length === 0) continue
      entries.push({ id: `arasaac:${id}`, library, keywords: words })
    }

    entries.sort((a, b) => a.id.localeCompare(b.id))
    const outPath = join(outDir, `${lang}.json`)
    await writeFile(outPath, JSON.stringify(entries))
    const kb = Math.round((await stat(outPath)).size / 1024)
    const notes = [
      authored && `${authored} locally authored`,
      borrowed && `${borrowed} borrowed ${FALLBACK}`,
      superseded && `${superseded} overrides now superseded upstream — delete them`,
      unusedOverrides.size &&
        `${unusedOverrides.size} overrides for pictograms not hosted here`,
    ].filter(Boolean)
    console.log(
      `${lang}.json: ${entries.length} entries, ${kb} KB` +
        (notes.length ? ` (${notes.join('; ')})` : ''),
    )
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildIndexes(join(root, 'public', 'symbols'), join(root, 'public', 'symbolIndex'))
}
