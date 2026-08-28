// Generates docs/slp-review.md and docs/slp-review-es.md — everything a
// speech-language pathologist needs to review the bundled vocabulary, without
// reading any JSON.
//
// §19.6 makes SLP sign-off a release gate, and §19.7 makes it a gate PER
// LANGUAGE: a Spanish board reviewed by an English-speaking clinician is not a
// review. So one packet per language, each written in the language it is
// asking about, because the reviewer for the Spanish boards reads Spanish.
//
// This does NOT satisfy the gate; it exists to make satisfying it cheap.
//
// Usage: node scripts/vocabulary/build-review-packet.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const read = async (p) => JSON.parse(await readFile(join(root, p), 'utf8'))

const overrides = await read('scripts/symbols/symbol-overrides.json')

// ---------------------------------------------------------------------------
// Per-language framing. Everything structural is shared; what changes is the
// prose, the level names, and the one question that is specific to how that
// language's boards were built.

const LANGUAGES = [
  {
    code: 'en',
    vocab: 'src/data/coreWords.json',
    symbols: 'src/data/seedSymbolMap.json',
    out: 'slp-review.md',
    levels: { 1: 'Basic', 2: 'Intermediate', 3: 'Full' },
    intent: {
      '3x4': 'emergent communicators, first words',
      '5x6': 'the standard board',
      '6x10': 'expanded, for users with more vocabulary',
    },
    t: {
      title: '# Vocabulary review — SayThrough',
      ask: [
        '> **What is being asked:** confirm this vocabulary is clinically sound for',
        '> AAC users, or tell us what to change. §19.6 makes this a release gate and',
        '> it has **not** been cleared — nothing here has been reviewed by a clinician.',
      ],
      provenance: [
        'Word lists were assembled from published core vocabulary sources (Project',
        "Core / Universal Core, AAC Language Lab, Banajee et al.) per the project's",
        "*adapt, don't invent* rule, then filled out by a developer. That last part",
        'is where the risk is.',
        '',
        'A recent example of what this review is for: **no form of the verb "to be"**',
        'existed on any board — no *am, is, are, was* — until a user tried to say "I',
        'am hungry" and could not. An audit then found 32 high-frequency words',
        'missing. Please assume more gaps of that kind remain.',
      ],
      boards: '## The boards',
      boardsHeader: '| Board | Pages | Core words | Total | Intended for |',
      coreMeans: [
        '"Core words" means the persistent region plus the core word pages — the',
        'vocabulary that works in any context, as opposed to topic nouns.',
      ],
      questions: '## Questions we need answered',
      q1: '### 1. Is the persistent core the right set?',
      q1body: [
        'These appear on **every page** at fixed positions and cannot be reached in',
        'fewer taps. Getting this wrong costs more than anything else here.',
      ],
      q2: '### 2. Are the vocabulary levels drawn in the right place?',
      q2body: [
        'A user set to Basic sees only level-1 words. Words never move between',
        'levels — raising a level only reveals more.',
      ],
      q3: '### 3. Words with no picture symbol',
      q3body: [
        'These render as text only. Conventional for function words in AAC, but',
        'please confirm none of them need a symbol — especially for pre-literate users.',
      ],
      q4: '### 4. Symbol choices nobody has looked at',
      q5: '### 5. Words whose colour changes between pages',
      q5body: [
        'Fitzgerald colour follows part of speech. These are coded differently on',
        'different pages, usually because the meaning differs (a body *back* vs.',
        'going *back*). Confirm that is right, or tell us to unify them.',
      ],
      q6: '### 6. Words that appear on more than one page',
      q6body: [
        'Repetition is normal in AAC — a word can belong in several places. Confirm',
        'each of these earns its second cell rather than wasting one.',
      ],
      full: '## Full vocabulary',
      persistentCore: '**Persistent core** (on every page)',
      tableHeader: '| Word | Type | Introduced at | Symbol |',
      coreWords: 'core words',
      topic: 'topic',
      textOnly: '— text only',
      checklist: '## Release checklist (§19.6)',
      checkItems: [
        '- [ ] From any page, a user can produce "help", "stop", "more", "I want ___"',
        '      and "I feel ___" in two selections or fewer',
        '- [ ] The persistent core is identical in content and position across every',
        '      page *(asserted automatically in `tests/unit/vocabulary.test.ts`)*',
        '- [ ] Word selection reviewed and approved',
        '- [ ] Level boundaries reviewed and approved',
        '- [ ] Symbol choices reviewed on-screen, including section 4',
      ],
      signoff: '**Reviewer:** _____________________  **Credentials:** _____________________',
      dateLine: '**Date:** _____________  **Outcome:** approved / approved with changes / not approved',
      footer:
        '_Generated by `scripts/vocabulary/build-review-packet.mjs` — regenerate after any vocabulary change._',
    },
  },
  {
    code: 'es',
    vocab: 'src/data/coreWords.es.json',
    symbols: 'src/data/seedSymbolMap.es.json',
    out: 'slp-review-es.md',
    levels: { 1: 'Básico', 2: 'Intermedio', 3: 'Completo' },
    intent: {
      '3x4': 'comunicadores emergentes, primeras palabras',
      '5x6': 'el tablero estándar',
      '6x10': 'ampliado, para usuarios con más vocabulario',
    },
    t: {
      title: '# Revisión del vocabulario — SayThrough (español)',
      ask: [
        '> **Qué se pide:** confirmar que este vocabulario es clínicamente sólido',
        '> para usuarios de CAA, o decirnos qué cambiar. El apartado §19.6 lo',
        '> convierte en un requisito de publicación y **no** se ha cumplido:',
        '> ningún profesional ha revisado nada de esto.',
      ],
      provenance: [
        'Las listas se adaptaron de trabajos publicados sobre vocabulario nuclear',
        "en español siguiendo la regla del proyecto *adaptar, no inventar*, y las",
        'completó una persona desarrolladora, no clínica. Ahí está el riesgo.',
        '',
        '**Estos tableros no son una traducción de los ingleses.** El español tiene',
        'dos cópulas (*ser* y *estar*), marca la persona en el verbo y flexiona los',
        'determinantes, así que el núcleo persistente, la página *Palabras de apoyo*',
        'y la distribución se decidieron de nuevo. Conviene revisarlos como tableros',
        'en español, no comparándolos con la versión inglesa.',
        '',
        'Un ejemplo de para qué sirve esta revisión: en los tableros ingleses **no',
        'existía ninguna forma del verbo *to be*** hasta que un usuario intentó',
        'decir "I am hungry" y no pudo. Una auditoría encontró después 32 palabras',
        'de alta frecuencia ausentes. Asuma que aquí quedan huecos parecidos.',
      ],
      boards: '## Los tableros',
      boardsHeader: '| Tablero | Páginas | Palabras nucleares | Total | Para quién |',
      coreMeans: [
        '«Palabras nucleares» significa la región persistente más las páginas de',
        'vocabulario nuclear: las palabras que sirven en cualquier contexto, frente',
        'a los sustantivos temáticos.',
      ],
      questions: '## Preguntas que necesitamos responder',
      q1: '### 1. ¿Es correcto el núcleo persistente?',
      q1body: [
        'Aparecen en **todas las páginas** en posiciones fijas y no se pueden',
        'alcanzar en menos toques. Equivocarse aquí cuesta más que cualquier otra',
        'cosa de este documento.',
      ],
      q2: '### 2. ¿Están bien trazados los niveles de vocabulario?',
      q2body: [
        'Un usuario en nivel Básico solo ve las palabras de nivel 1. Las palabras',
        'nunca cambian de sitio entre niveles: subir de nivel solo muestra más.',
      ],
      q3: '### 3. Palabras sin pictograma',
      q3body: [
        'Se muestran solo como texto. Es lo habitual en CAA para las palabras',
        'funcionales, pero confirme que ninguna necesita pictograma, sobre todo',
        'para usuarios que aún no leen.',
      ],
      q4: '### 4. Pictogramas que nadie ha mirado',
      q5: '### 5. Palabras que cambian de color entre páginas',
      q5body: [
        'El color Fitzgerald sigue la categoría gramatical. Estas palabras están',
        'codificadas de forma distinta en páginas distintas, normalmente porque el',
        'significado cambia. Confirme si es correcto o si deben unificarse.',
      ],
      q6: '### 6. Palabras que aparecen en más de una página',
      q6body: [
        'La repetición es normal en CAA: una palabra puede pertenecer a varios',
        'sitios. Confirme que cada una merece su segunda casilla.',
      ],
      full: '## Vocabulario completo',
      persistentCore: '**Núcleo persistente** (en todas las páginas)',
      tableHeader: '| Palabra | Tipo | Se introduce en | Pictograma |',
      coreWords: 'vocabulario nuclear',
      topic: 'tema',
      textOnly: '— solo texto',
      checklist: '## Lista de comprobación para publicar (§19.6)',
      checkItems: [
        '- [ ] Desde cualquier página se pueden producir «ayuda», «para», «más»,',
        '      «quiero ___» y «estoy ___» en dos selecciones o menos',
        '- [ ] El núcleo persistente es idéntico en contenido y posición en todas',
        '      las páginas *(comprobado automáticamente en `tests/unit/vocabulary.test.ts`)*',
        '- [ ] Selección de palabras revisada y aprobada',
        '- [ ] Límites de nivel revisados y aprobados',
        '- [ ] Pictogramas revisados en pantalla, incluido el apartado 4',
        '- [ ] Las formas verbales que ofrece la pulsación larga son correctas',
        '      *(persona, género y número — véase §19.7)*',
      ],
      signoff: '**Revisor/a:** _____________________  **Titulación:** _____________________',
      dateLine:
        '**Fecha:** _____________  **Resultado:** aprobado / aprobado con cambios / no aprobado',
      footer:
        '_Generado por `scripts/vocabulary/build-review-packet.mjs`: vuelva a generarlo después de cualquier cambio de vocabulario._',
    },
  },
]

// ---------------------------------------------------------------------------

async function buildPacket(config) {
  const vocab = await read(config.vocab)
  const symbols = await read(config.symbols)
  const { t, levels: LEVEL } = config
  const out = []
  const w = (s = '') => out.push(s)

  w(t.title)
  w()
  for (const line of t.ask) w(line)
  w()
  for (const line of t.provenance) w(line)
  w()

  w(t.boards)
  w()
  w(t.boardsHeader)
  w('|---|---|---|---|---|')
  for (const [key, v] of Object.entries(vocab.sizes)) {
    const core =
      v.core.length +
      Object.keys(v.corePages ?? {}).reduce((n, p) => n + v.topics[p].length, 0)
    const total =
      v.core.length + Object.values(v.topics).reduce((n, ws) => n + ws.length, 0)
    w(
      `| ${v.rows}×${v.columns} | ${Object.keys(v.topics).length} | ${core} | ${total} | ${config.intent[key] ?? ''} |`,
    )
  }
  w()
  for (const line of t.coreMeans) w(line)
  w()

  w(t.questions)
  w()
  w(t.q1)
  w()
  for (const line of t.q1body) w(line)
  w()
  for (const v of Object.values(vocab.sizes)) {
    w(`- **${v.rows}×${v.columns}** (${v.core.length}): ${v.core.map((x) => x[0]).join(', ')}`)
  }
  w()

  w(t.q2)
  w()
  for (const line of t.q2body) w(line)
  w()
  for (const v of Object.values(vocab.sizes)) {
    const counts = { 1: 0, 2: 0, 3: 0 }
    for (const ws of Object.values(v.topics)) for (const x of ws) counts[x[2]]++
    w(
      `- **${v.rows}×${v.columns}**: ${LEVEL[1]} ${counts[1]}, ${LEVEL[2]} ${counts[2]}, ${LEVEL[3]} ${counts[3]}`,
    )
  }
  w()

  w(t.q3)
  w()
  for (const line of t.q3body) w(line)
  w()
  const noSymbol = new Set()
  for (const v of Object.values(vocab.sizes)) {
    for (const x of v.core) if (!symbols[x[0]]) noSymbol.add(x[0])
    for (const ws of Object.values(v.topics)) {
      for (const x of ws) if (!symbols[x[0]]) noSymbol.add(x[0])
    }
  }
  w([...noSymbol].sort().map((x) => '`' + x + '`').join(', '))
  w()

  w(t.q4)
  w()
  if (config.code === 'en') {
    w('These labels had no exact ARASAAC match, so a synonym was used and the')
    w('resulting picture has never been viewed. **Please check these on-screen.**')
    w()
    const pending = (overrides._pendingVisualCheck ?? '').split(':').pop().trim()
    w(pending.split(',').map((x) => '`' + x.trim() + '`').join(', '))
  } else {
    // Spanish reuses the ARASAAC id curated for the equivalent English
    // concept — the pictogram is language-neutral, but the equivalence was
    // a developer's judgement and has not been checked on screen.
    w('Los pictogramas de ARASAAC son los mismos en todos los idiomas, así que')
    w('cada palabra española reutiliza el identificador ya elegido para el')
    w('concepto inglés equivalente. Esa equivalencia la decidió una persona')
    w('desarrolladora y **no se ha comprobado en pantalla**: un pictograma puede')
    w('ser correcto para la palabra inglesa y equívoco para la española.')
    w()
    w('Revise especialmente las palabras cuyo concepto no es uno a uno entre los')
    w('dos idiomas — por ejemplo `coger`, `parar`, `gusta`, `hay`, `es` y `está`,')
    w('donde el inglés tiene una sola palabra y el español dos, o al revés.')
  }
  w()

  w(t.q5)
  w()
  for (const line of t.q5body) w(line)
  w()
  for (const v of Object.values(vocab.sizes)) {
    const places = {}
    const add = (x, page) => {
      places[x[0]] ??= []
      places[x[0]].push({ pos: x[1], page })
    }
    for (const x of v.core) add(x, config.code === 'es' ? 'el núcleo' : 'the core region')
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

  w(t.q6)
  w()
  for (const line of t.q6body) w(line)
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
      w(
        `- **${v.rows}×${v.columns}** (${dupes.length}): ` +
          dupes.map(([l, ps]) => '`' + l + '` (' + ps.join(', ') + ')').join(', '),
      )
    }
  }
  w()

  w(t.full)
  w()
  for (const v of Object.values(vocab.sizes)) {
    w(`### ${v.rows}×${v.columns} — ${v.name}`)
    w()
    w(`${t.persistentCore}: ${v.core.map((x) => x[0]).join(', ')}`)
    w()
    const core = Object.keys(v.corePages ?? {})
    const order = [...core, ...Object.keys(v.topics).filter((x) => !core.includes(x))]
    for (const page of order) {
      w(`**${page}** *(${core.includes(page) ? t.coreWords : t.topic})*`)
      w()
      w(t.tableHeader)
      w('|---|---|---|---|')
      for (const [label, pos, level] of v.topics[page]) {
        w(`| ${label} | ${pos} | ${LEVEL[level]} | ${symbols[label] ?? t.textOnly} |`)
      }
      w()
    }
  }

  w(t.checklist)
  w()
  for (const line of t.checkItems) w(line)
  w()
  w('---')
  w()
  w(t.signoff)
  w()
  w(t.dateLine)
  w()
  w(t.footer)

  await mkdir(join(root, 'docs'), { recursive: true })
  await writeFile(join(root, 'docs', config.out), out.join('\n') + '\n')
  console.log(`docs/${config.out} written — ${out.length} lines`)
}

for (const config of LANGUAGES) await buildPacket(config)
