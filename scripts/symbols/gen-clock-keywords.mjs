// Generates the Polish clock-face entries for keyword-overrides.pl.json.
//
// ARASAAC's "day hours" set is 145 pictograms — o'clock / quarter past /
// half past / quarter to, around the 24-hour dial — and 96 of them arrived
// after the Polish translation effort stopped in 2024. They are the one block
// worth generating rather than translating by hand, because Polish clock time
// is a RULE, and it is a rule machine translation reliably gets wrong:
//
//   03:00  trzecia                     ← feminine ordinal (agrees with `godzina`)
//   03:15  kwadrans po trzeciej        ← `po` + locative
//   03:30  wpół do CZWARTEJ            ← "half TO four", NOT "half past three".
//                                         Spanish `tres y media` and English
//                                         `half past three` both name the
//                                         CURRENT hour; Polish names the NEXT
//                                         one, in the genitive. Translating
//                                         either source literally gives
//                                         `wpół po trzeciej`, which is wrong.
//   03:45  za kwadrans czwarta         ← `za` + nominative of the next hour
//
// The time itself is read from ARASAAC's own English keyword (`03:45h`), so
// nothing here guesses which pictogram is which.
//
// Usage: node scripts/symbols/gen-clock-keywords.mjs        # print
//        node scripts/symbols/gen-clock-keywords.mjs --write # merge into overrides

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

// Feminine ordinals 1–12. NOMINATIVE for a bare hour and after `za`;
// LOCATIVE/GENITIVE (identical in this paradigm, both -ej) after `po` and
// `wpół do`.
const NOM = [
  '', 'pierwsza', 'druga', 'trzecia', 'czwarta', 'piąta', 'szósta',
  'siódma', 'ósma', 'dziewiąta', 'dziesiąta', 'jedenasta', 'dwunasta',
]
const OBL = [
  '', 'pierwszej', 'drugiej', 'trzeciej', 'czwartej', 'piątej', 'szóstej',
  'siódmej', 'ósmej', 'dziewiątej', 'dziesiątej', 'jedenastej', 'dwunastej',
]

const to12 = (h) => (h % 12 === 0 ? 12 : h % 12)
const nextOf = (h12) => (h12 % 12) + 1

export function polishTime(hour, minute) {
  const h12 = to12(hour)
  const digital = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  switch (minute) {
    case 0: {
      const words = [NOM[h12], `godzina ${NOM[h12]}`]
      // Midnight and noon have their own names, and a schedule board wants them.
      if (hour === 0) words.unshift('północ')
      if (hour === 12) words.unshift('południe')
      return [...words, digital]
    }
    case 15:
      return [`kwadrans po ${OBL[h12]}`, `piętnaście po ${OBL[h12]}`, digital]
    case 30:
      // The next hour, in the genitive — the rule this file exists for.
      return [`wpół do ${OBL[nextOf(h12)]}`, digital]
    case 45:
      return [
        `za kwadrans ${NOM[nextOf(h12)]}`,
        `za piętnaście ${NOM[nextOf(h12)]}`,
        digital,
      ]
    default:
      return null // ARASAAC only ships the quarters
  }
}

const kw = (p) => (p.keywords ?? []).map((k) => k.keyword).filter(Boolean)
const load = (l) =>
  readFile(join(here, 'data', `arasaac-index-${l}.json`), 'utf8').then(JSON.parse)

const [pl, en] = await Promise.all([load('pl'), load('en')])
const enById = new Map(en.map((p) => [p._id, kw(p)]))

const generated = {}
const skipped = []
for (const picto of pl) {
  if (kw(picto).length) continue // ARASAAC has Polish for it — leave it alone
  if (!(picto.categories ?? []).includes('day hours')) continue
  // ARASAAC states the time in its own English keywords, e.g. "03:45h"
  const stamp = (enById.get(picto._id) ?? [])
    .map((k) => k.match(/^(\d{1,2}):(\d{2})h?$/))
    .find(Boolean)
  if (!stamp) {
    skipped.push(`${picto._id} (${(enById.get(picto._id) ?? []).join(', ')})`)
    continue
  }
  const words = polishTime(Number(stamp[1]), Number(stamp[2]))
  if (!words) {
    skipped.push(`${picto._id} — ${stamp[0]} is not a quarter`)
    continue
  }
  generated[String(picto._id)] = words
}

const count = Object.keys(generated).length
if (process.argv.includes('--write')) {
  const path = join(here, 'keyword-overrides.pl.json')
  const existing = JSON.parse(await readFile(path, 'utf8').catch(() => '{}'))
  const merged = { ...existing, ...generated }
  // keys sorted numerically so the file diffs sanely
  const out = {}
  for (const k of Object.keys(merged).filter((k) => k.startsWith('_'))) out[k] = merged[k]
  for (const k of Object.keys(merged)
    .filter((k) => !k.startsWith('_'))
    .sort((a, b) => Number(a) - Number(b))) {
    out[k] = merged[k]
  }
  await writeFile(path, JSON.stringify(out, null, 2) + '\n')
  console.log(`merged ${count} clock entries → ${path}`)
} else {
  for (const [id, words] of Object.entries(generated)) {
    console.log(`  ${id}: ${words.join('  ·  ')}`)
  }
  console.log(`\n${count} generated`)
}
if (skipped.length) console.log(`skipped ${skipped.length}:\n  ${skipped.join('\n  ')}`)
