// Generates docs/slp-review.md — everything a speech-language pathologist
// needs to review the bundled vocabulary, without reading any JSON.
//
// §19.6 makes SLP sign-off a release gate. This does NOT satisfy that gate; it
// exists to make satisfying it cheap. The questions near the top are the ones
// a clinician is uniquely able to answer.
//
// Usage: node scripts/vocabulary/build-review-packet.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const read = async (p) => JSON.parse(await readFile(join(root, p), 'utf8'))

const vocab = await read('src/data/coreWords.json')
const symbols = await read('src/data/seedSymbolMap.json')
const overrides = await read('scripts/symbols/symbol-overrides.json')

const LEVEL = { 1: 'Basic', 2: 'Intermediate', 3: 'Full' }
const out = []
const w = (s = '') => out.push(s)

w('# Vocabulary review — SayThrough')
w()
w('> **What is being asked:** confirm this vocabulary is clinically sound for')
w('> AAC users, or tell us what to change. §19.6 makes this a release gate and')
w('> it has **not** been cleared — nothing here has been reviewed by a clinician.')
w()
w('Word lists were assembled from published core vocabulary sources (Project')
w("Core / Universal Core, AAC Language Lab, Banajee et al.) per the project's")
w('*adapt, don\'t invent* rule, then filled out by a developer. That last part')
w('is where the risk is.')
w()
w('A recent example of what this review is for: **no form of the verb "to be"**')
w('existed on any board — no *am, is, are, was* — until a user tried to say "I')
w('am hungry" and could not. An audit then found 32 high-frequency words')
w('missing. Please assume more gaps of that kind remain.')
w()

w('## The boards')
w()
w('| Board | Pages | Core words | Total | Intended for |')
w('|---|---|---|---|---|')
const intent = {
  '3x4': 'emergent communicators, first words',
  '5x6': 'the standard board',
  '6x10': 'expanded, for users with more vocabulary',
}
for (const [key, v] of Object.entries(vocab.sizes)) {
  const core = v.core.length + Object.keys(v.corePages ?? {})
    .reduce((n, p) => n + v.topics[p].length, 0)
  const total = v.core.length + Object.values(v.topics).reduce((n, ws) => n + ws.length, 0)
  w(`| ${v.rows}×${v.columns} | ${Object.keys(v.topics).length} | ${core} | ${total} | ${intent[key] ?? ''} |`)
}
w()
w('"Core words" means the persistent region plus the core word pages — the')
w('vocabulary that works in any context, as opposed to topic nouns.')
w()

w('## Questions we need answered')
w()
w('### 1. Is the persistent core the right set?')
w()
w('These appear on **every page** at fixed positions and cannot be reached in')
w('fewer taps. Getting this wrong costs more than anything else here.')
w()
for (const v of Object.values(vocab.sizes)) {
  w(`- **${v.rows}×${v.columns}** (${v.core.length}): ${v.core.map((x) => x[0]).join(', ')}`)
}
w()
w('### 2. Are the vocabulary levels drawn in the right place?')
w()
w('A user set to Basic sees only level-1 words. Words never move between')
w('levels — raising a level only reveals more.')
w()
for (const v of Object.values(vocab.sizes)) {
  const counts = { 1: 0, 2: 0, 3: 0 }
  for (const ws of Object.values(v.topics)) for (const x of ws) counts[x[2]]++
  w(`- **${v.rows}×${v.columns}**: Basic ${counts[1]}, Intermediate ${counts[2]}, Full ${counts[3]}`)
}
w()
w('### 3. Words with no picture symbol')
w()
w('These render as text only. Conventional for function words in AAC, but')
w('please confirm none of them need a symbol — especially for pre-literate users.')
w()
const noSymbol = new Set()
for (const v of Object.values(vocab.sizes)) {
  for (const x of v.core) if (!symbols[x[0]]) noSymbol.add(x[0])
  for (const ws of Object.values(v.topics)) for (const x of ws) if (!symbols[x[0]]) noSymbol.add(x[0])
}
w([...noSymbol].sort().map((x) => '`' + x + '`').join(', '))
w()
w('### 4. Symbol choices nobody has looked at')
w()
w('These labels had no exact ARASAAC match, so a synonym was used and the')
w('resulting picture has never been viewed. **Please check these on-screen.**')
w()
const pending = (overrides._pendingVisualCheck ?? '').split(':').pop().trim()
w(pending.split(',').map((x) => '`' + x.trim() + '`').join(', '))
w()
w('### 5. Words whose colour changes between pages')
w()
w('Fitzgerald colour follows part of speech. These are coded differently on')
w('different pages, usually because the meaning differs (a body *back* vs.')
w('going *back*). Confirm that is right, or tell us to unify them.')
w()
for (const v of Object.values(vocab.sizes)) {
  const places = {}
  const add = (x, page) => {
    places[x[0]] ??= []
    places[x[0]].push({ pos: x[1], page })
  }
  for (const x of v.core) add(x, 'the core region')
  for (const [page, ws] of Object.entries(v.topics)) for (const x of ws) add(x, page)
  const conflicts = Object.entries(places).filter(
    ([, ps]) => new Set(ps.map((p) => p.pos)).size > 1,
  )
  if (conflicts.length) {
    w(`- **${v.rows}×${v.columns}**`)
    for (const [label, ps] of conflicts) {
      w('  - `' + label + '` — ' + ps.map((p) => `${p.pos} on ${p.page}`).join('; '))
    }
  }
}
w()
w('### 6. Words that appear on more than one page')
w()
w('Repetition is normal in AAC — a word can belong in several places. Confirm')
w('each of these earns its second cell rather than wasting one.')
w()
for (const v of Object.values(vocab.sizes)) {
  const places = {}
  const add = (x, page) => {
    places[x[0]] ??= []
    places[x[0]].push(page)
  }
  for (const [page, ws] of Object.entries(v.topics)) for (const x of ws) add(x, page)
  const dupes = Object.entries(places).filter(([, ps]) => ps.length > 1)
  if (dupes.length) {
    w(`- **${v.rows}×${v.columns}** (${dupes.length}): ` +
      dupes.map(([l, ps]) => '`' + l + '` (' + ps.join(', ') + ')').join(', '))
  }
}
w()

w('## Full vocabulary')
w()
for (const v of Object.values(vocab.sizes)) {
  w(`### ${v.rows}×${v.columns} — ${v.name}`)
  w()
  w(`**Persistent core** (on every page): ${v.core.map((x) => x[0]).join(', ')}`)
  w()
  const core = Object.keys(v.corePages ?? {})
  const order = [...core, ...Object.keys(v.topics).filter((t) => !core.includes(t))]
  for (const page of order) {
    w(`**${page}** *(${core.includes(page) ? 'core words' : 'topic'})*`)
    w()
    w('| Word | Type | Introduced at | Symbol |')
    w('|---|---|---|---|')
    for (const [label, pos, level] of v.topics[page]) {
      w(`| ${label} | ${pos} | ${LEVEL[level]} | ${symbols[label] ?? '— text only'} |`)
    }
    w()
  }
}

w('## Release checklist (§19.6)')
w()
w('- [ ] From any page, a user can produce "help", "stop", "more", "I want ___"')
w('      and "I feel ___" in two selections or fewer')
w('- [ ] The persistent core is identical in content and position across every')
w('      page *(asserted automatically in `tests/unit/vocabulary.test.ts`)*')
w('- [ ] Word selection reviewed and approved')
w('- [ ] Level boundaries reviewed and approved')
w('- [ ] Symbol choices reviewed on-screen, including section 4')
w()
w('---')
w()
w('**Reviewer:** _____________________  **Credentials:** _____________________')
w()
w('**Date:** _____________  **Outcome:** approved / approved with changes / not approved')
w()
w('_Generated by `scripts/vocabulary/build-review-packet.mjs` — regenerate after any vocabulary change._')

await mkdir(join(root, 'docs'), { recursive: true })
await writeFile(join(root, 'docs', 'slp-review.md'), out.join('\n') + '\n')
console.log(`docs/slp-review.md written — ${out.length} lines`)
