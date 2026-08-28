import { POS_COLORS, PartOfSpeech, UI_COLORS } from '../constants/colors'
import { type LanguageCode, SUPPORTED_LANGUAGES, langCode } from '../i18n'
import type { Storage } from '../storage/types'
import type { Button, ButtonAction, Page, PageSet } from '../types/models'
import coreWordsEsJson from './coreWords.es.json'
import coreWordsPlJson from './coreWords.pl.json'
import coreWordsJson from './coreWords.json'
import seedSymbolMapEsJson from './seedSymbolMap.es.json'
import seedSymbolMapPlJson from './seedSymbolMap.pl.json'
import seedSymbolMapJson from './seedSymbolMap.json'

// Built-in content uses STABLE, deterministic ids (not random uuids) so
// content updates can rebuild the bundled pages/buttons IN PLACE while
// leaving user profiles, word lists, tracking, and user-created pages
// untouched. Profile.activePageSetId and word-list button references stay
// valid across versions because the ids never change.
//
// §19 layout: the leftmost `coreColumns` are the persistent core region —
// identical words at identical positions on EVERY page (§19.6) — and the
// remaining columns hold page-specific content: topic-navigation buttons on
// the home page, topic words on topic pages.
//
// One page set is authored PER GRID SIZE. §19.2: a motor-plan layout cannot
// be reflowed, because changing the grid moves every word. Sizes are chosen
// once at setup; they are not a resize control.

export type VocabularyLevel = 1 | 2 | 3
type Word = [string, PartOfSpeech, VocabularyLevel]

interface SizeLayout {
  name: string
  shortName: string
  rows: number
  columns: number
  coreColumns: number
  core: Word[]
  topicLevels: Record<string, VocabularyLevel>
  /**
   * Pages holding CORE vocabulary — words that work in any context — mapped to
   * the Fitzgerald colour of their contents. Everything else is a topic page.
   */
  corePages: Record<string, PartOfSpeech>
  topics: Record<string, Word[]>
}

// §19.7: one authored layout set PER LANGUAGE. Spanish is not a translation
// of the English boards — it carries two copulas, marks person on the verb
// and inflects its determiners, so the core layout and the Palabras de apoyo
// page differ by design. See scripts/vocabulary/build-spanish-core.mjs.
const LAYOUTS: Record<LanguageCode, Record<string, SizeLayout>> = {
  en: coreWordsJson.sizes as unknown as Record<string, SizeLayout>,
  es: coreWordsEsJson.sizes as unknown as Record<string, SizeLayout>,
  pl: coreWordsPlJson.sizes as unknown as Record<string, SizeLayout>,
}

const SYMBOL_MAPS: Record<LanguageCode, Record<string, string>> = {
  en: seedSymbolMapJson as Record<string, string>,
  es: seedSymbolMapEsJson as Record<string, string>,
  pl: seedSymbolMapPlJson as Record<string, string>,
}

// Seeded labels that are STRUCTURE rather than vocabulary. These are stored
// on the button rows, so they are frozen at seed time — which is correct,
// because each language has its own page sets: the English board says
// "Back", the Spanish one says "Atrás", and neither changes under the other.
const CHROME: Record<
  LanguageCode,
  { back: string; more: string; home: string; quickPhrases: string; quickDescription: string }
> = {
  en: {
    back: 'Back', more: 'More', home: 'Home',
    quickPhrases: 'Quick Phrases',
    quickDescription: 'Pre-stored phrases spoken with one tap (§19.5)',
  },
  es: {
    back: 'Atrás', more: 'Más', home: 'Inicio',
    quickPhrases: 'Frases rápidas',
    quickDescription: 'Frases guardadas que se dicen con un solo toque (§19.5)',
  },
  pl: {
    back: 'Wstecz', more: 'Więcej', home: 'Start',
    quickPhrases: 'Szybkie zdania',
    quickDescription: 'Gotowe zdania wypowiadane jednym dotknięciem (§19.5)',
  },
}

export const LANGUAGE_CODES: LanguageCode[] = SUPPORTED_LANGUAGES.map((l) => l.code)

/** The size whose ids shipped first; it keeps them for back-compatibility. */
export const DEFAULT_SIZE = '5x6'
// Every language authors the same three sizes, so one list serves all of them.
export const SIZE_KEYS = Object.keys(LAYOUTS.en)

// Accents are folded rather than dropped, so "Palabras pequeñas" becomes
// `palabras-pequenas` instead of `palabras-peque-as`. English topic names are
// ASCII, so existing ids are unaffected.
const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// The English 5×6 set predates both multi-size and multi-language support and
// must keep the exact ids it shipped with, or existing profiles, word lists
// and user pages would all point at rows that no longer exist. English keeps
// its unsuffixed ids for the same reason; every other language is suffixed.
const langPart = (lang: LanguageCode) => (lang === 'en' ? '' : `-${lang}`)
const isLegacy = (lang: LanguageCode, size: string) =>
  lang === 'en' && size === DEFAULT_SIZE

const setIdFor = (lang: LanguageCode, size: string) =>
  isLegacy(lang, size) ? 'builtin-core-vocabulary' : `builtin-core${langPart(lang)}-${size}`
const homeIdFor = (lang: LanguageCode, size: string) =>
  isLegacy(lang, size) ? 'builtin-core-home' : `builtin-core${langPart(lang)}-${size}-home`
const topicIdFor = (lang: LanguageCode, size: string, topic: string) =>
  isLegacy(lang, size)
    ? `builtin-core-${slug(topic)}`
    : `builtin-core${langPart(lang)}-${size}-${slug(topic)}`

const quickSetIdFor = (lang: LanguageCode) =>
  lang === 'en' ? 'builtin-quick-phrases' : `builtin-quick-phrases-${lang}`

// The meta key the toolbar's Quick jump reads. English keeps the original key.
export const quickPhrasesMetaKey = (lang: LanguageCode) =>
  lang === 'en' ? 'quickPhrasesPageSetId' : `quickPhrasesPageSetId:${lang}`

export const CORE_SET_ID = setIdFor('en', DEFAULT_SIZE)

/** Id of a bundled core set. Exported so tests can address one directly
 *  rather than inferring it from grid dimensions, which no longer identify a
 *  set now that every language authors the same sizes. */
export function builtInCoreSetId(lang: LanguageCode, size: string): string {
  return setIdFor(lang, size)
}

/** Structural labels (Back / More / Home) for a language. */
export function chromeLabels(lang: LanguageCode): { back: string; more: string; home: string } {
  const { back, more, home } = CHROME[lang]
  return { back, more, home }
}

/** The authored layout for a (language, size), for tests and tooling. */
export function layoutFor(lang: LanguageCode, size: string): SizeLayout {
  return LAYOUTS[lang][size]
}

/** Default page set for a language — what a new profile in it starts on. */
export function coreSetIdForLanguage(language: string | undefined): string {
  return setIdFor(langCode(language), DEFAULT_SIZE)
}

/**
 * The same board SIZE in another language. Switching language must not also
 * change grid size — a 6×10 user landing on 5×6 would lose two thirds of
 * their vocabulary and every motor plan they had built.
 */
export function sameSizeInLanguage(
  pageSetId: string,
  lang: LanguageCode,
): string | null {
  for (const size of SIZE_KEYS) {
    for (const from of LANGUAGE_CODES) {
      if (setIdFor(from, size) === pageSetId) return setIdFor(lang, size)
    }
  }
  if (LANGUAGE_CODES.some((from) => quickSetIdFor(from) === pageSetId)) {
    return quickSetIdFor(lang)
  }
  return null
}

/** Which language a built-in page set belongs to, or null if it is not one. */
export function languageOfPageSet(pageSetId: string): LanguageCode | null {
  for (const lang of LANGUAGE_CODES) {
    for (const size of SIZE_KEYS) {
      if (setIdFor(lang, size) === pageSetId) return lang
    }
    if (quickSetIdFor(lang) === pageSetId) return lang
  }
  return null
}

function makeButton(
  lang: LanguageCode,
  pageId: string,
  label: string,
  pos: PartOfSpeech,
  row: number,
  column: number,
  actions: ButtonAction[],
  isNavigationButton = false,
  now = 0,
): Button {
  return {
    id: `${pageId}-r${row}-c${column}`, // stable: one button per cell
    pageId,
    row,
    column,
    rowSpan: 1,
    columnSpan: 1,
    label,
    partOfSpeech: pos,
    symbolId: SYMBOL_MAPS[lang][label],
    backgroundColor: POS_COLORS[pos],
    borderColor: UI_COLORS.buttonBorder,
    borderWidth: 1,
    labelColor: UI_COLORS.label,
    labelFontSize: 14,
    labelFontWeight: 'bold',
    symbolScale: 0.65,
    isHidden: false,
    isNavigationButton,
    actions,
    isBuiltIn: true,
    createdAt: now,
    updatedAt: now,
  }
}

// Places `words` row-major into a region `width` columns wide starting at
// `columnOffset`. `startIndex` shifts placement forward (reserving the first
// content cell for Back); anything past the last row flows off.
function placeWords(
  lang: LanguageCode,
  pageId: string,
  words: Word[],
  columnOffset: number,
  width: number,
  rows: number,
  actionsFor: (label: string) => ButtonAction[],
  now: number,
  startIndex = 0,
): Array<{ button: Button; level: VocabularyLevel }> {
  return words
    .map(([label, pos, level], i) => {
      const idx = i + startIndex
      return {
        button: makeButton(
          lang,
          pageId,
          label,
          pos,
          Math.floor(idx / width),
          columnOffset + (idx % width),
          actionsFor(label),
          false,
          now,
        ),
        level,
      }
    })
    .filter((entry) => entry.button.row < rows)
}

// A real Back button in the first content cell (§19.6 motor plan: its
// position is fixed in the data, so it never moves between edit and use
// mode). SymbolButton draws a ← arrow for navigate_back buttons.
function makeBackButton(
  lang: LanguageCode,
  pageId: string,
  coreColumns: number,
  now: number,
): Button {
  return {
    ...makeButton(
      lang,
      pageId,
      CHROME[lang].back,
      'category',
      0,
      coreColumns,
      [{ type: 'navigate_back' }],
      false,
      now,
    ),
    backgroundColor: '#ECEFF1',
    symbolId: undefined,
  }
}

/**
 * Split a topic's words across pages. Each page spends one cell on Back, and
 * a page with more to come spends its LAST cell on "More", so the remaining
 * words get their own page instead of being silently dropped off the grid —
 * which is what used to happen to the 15th Actions word.
 */
function chunk<T>(items: T[], capacity: number): T[][] {
  if (capacity < 2) return [items.slice(0, Math.max(capacity, 0))]
  const pages: T[][] = []
  let index = 0
  while (index < items.length) {
    const remaining = items.length - index
    const take = remaining > capacity ? capacity - 1 : remaining
    pages.push(items.slice(index, index + take))
    index += take
  }
  return pages
}

interface BuiltSet {
  pageSet: PageSet
  pages: Page[]
  buttons: Button[]
  /** buttonId → the level at which that button appears. */
  levels: Map<string, VocabularyLevel>
}

/**
 * Build one size's page set in memory. Pure apart from `now`, and the single
 * source of truth for both seeding and the level map — deriving them from the
 * same function is what stops the two drifting apart.
 */
function buildSet(lang: LanguageCode, size: string, now: number): BuiltSet {
  const layout = LAYOUTS[lang][size]
  const pageSetId = setIdFor(lang, size)
  const homePageId = homeIdFor(lang, size)
  const contentColumns = layout.columns - layout.coreColumns
  const topicIds = new Map(
    Object.keys(layout.topics).map((t) => [t, topicIdFor(lang, size, t)]),
  )

  const pageSet: PageSet = {
    id: pageSetId,
    name: layout.name,
    description: `Bundled starter vocabulary, ${layout.rows}×${layout.columns} (§19) — pending SLP review`,
    language: lang,
    rootPageId: homePageId,
    schemaVersion: 1,
    isBuiltIn: true,
    createdAt: now,
    updatedAt: now,
  }

  const makePage = (id: string, name: string): Page => ({
    id,
    pageSetId,
    name,
    rows: layout.rows,
    columns: layout.columns,
    backgroundColor: '#FFFFFF',
    showMessageBar: true,
    showToolbar: true,
    isBuiltIn: true,
    createdAt: now,
    updatedAt: now,
  })

  const appendAction = (): ButtonAction[] => [{ type: 'append_to_message' }]
  const pages: Page[] = [makePage(homePageId, CHROME[lang].home)]
  const buttons: Button[] = []
  const levels = new Map<string, VocabularyLevel>()

  const add = (button: Button, level: VocabularyLevel) => {
    buttons.push(button)
    levels.set(button.id, level)
  }

  // Core region — identical on every page (home + topics)
  for (const pageId of [homePageId, ...topicIds.values()]) {
    for (const entry of placeWords(
      lang,
      pageId,
      layout.core,
      0,
      layout.coreColumns,
      layout.rows,
      appendAction,
      now,
    )) {
      add(entry.button, entry.level)
    }
  }

  // Every page keeps at least one FREE cell. A starter board filled to 100%
  // cannot be personalised without deleting something first, and adding the
  // child's own words — family names, a favourite food — is central to AAC,
  // not an afterthought. Reserved here in the generator so the headroom is
  // enforced rather than left to whoever edits the word lists.
  const HEADROOM = 1
  const contentCells = layout.rows * contentColumns

  // Home page content region: topic-navigation buttons, overflowing onto a
  // second home page through "More" exactly as a long topic does.
  const navCapacity = contentCells - HEADROOM
  const topicEntries = [...topicIds.entries()]
  const navChunks = chunk(topicEntries, navCapacity)

  navChunks.forEach((navChunk, chunkIndex) => {
    const pageId = chunkIndex === 0 ? homePageId : `${homePageId}-${chunkIndex + 1}`
    if (chunkIndex > 0) {
      pages.push(makePage(pageId, `Home ${chunkIndex + 1}`))
      for (const entry of placeWords(
        lang,
        pageId,
        layout.core,
        0,
        layout.coreColumns,
        layout.rows,
        appendAction,
        now,
      )) {
        add(entry.button, entry.level)
      }
      add(makeBackButton(lang, pageId, layout.coreColumns, now), 1)
    }

    // Continuation pages spend their first content cell on Back.
    const offset = chunkIndex === 0 ? 0 : 1
    navChunk.forEach(([topic, targetPageId], i) => {
      const index = i + offset
      // A core page's button carries its content's colour, so the home page
      // reads at a glance: green leads to verbs, purple to describing words.
      // Topic pages stay category grey.
      add(
        makeButton(
          lang,
          pageId,
          topic,
          layout.corePages?.[topic] ?? 'category',
          Math.floor(index / contentColumns),
          layout.coreColumns + (index % contentColumns),
          [{ type: 'navigate', pageId: targetPageId }],
          true,
          now,
        ),
        layout.topicLevels[topic] ?? 1,
      )
    })

    const nextChunk = navChunks[chunkIndex + 1]
    if (nextChunk) {
      add(
        makeButton(
          lang,
          pageId,
          CHROME[lang].more,
          'category',
          layout.rows - 1,
          layout.columns - 1,
          [{ type: 'navigate', pageId: `${homePageId}-${chunkIndex + 2}` }],
          true,
          now,
        ),
        Math.min(
          ...nextChunk.map(([topic]) => layout.topicLevels[topic] ?? 1),
        ) as VocabularyLevel,
      )
    }
  })

  // Topic pages: Back in the first content cell, then topic words after it,
  // continuing onto "More" pages when a topic outgrows one screen.
  const capacity = contentCells - 1 - HEADROOM // Back, plus a free cell
  for (const [topic, words] of Object.entries(layout.topics)) {
    const topicLevel = layout.topicLevels[topic] ?? 1
    const chunks = chunk(words, capacity)

    chunks.forEach((chunk, chunkIndex) => {
      const pageId =
        chunkIndex === 0
          ? topicIds.get(topic)!
          : `${topicIds.get(topic)!}-${chunkIndex + 1}`
      const pageName = chunkIndex === 0 ? topic : `${topic} ${chunkIndex + 1}`
      // Core region for continuation pages (the first page got its own above).
      if (chunkIndex > 0) {
        pages.push(makePage(pageId, pageName))
        for (const entry of placeWords(
          lang,
          pageId,
          layout.core,
          0,
          layout.coreColumns,
          layout.rows,
          appendAction,
          now,
        )) {
          add(entry.button, entry.level)
        }
      } else {
        pages.push(makePage(pageId, pageName))
      }

      add(makeBackButton(lang, pageId, layout.coreColumns, now), 1) // always the way out

      for (const entry of placeWords(
        lang,
        pageId,
        chunk,
        layout.coreColumns,
        contentColumns,
        layout.rows,
        appendAction,
        now,
        1,
      )) {
        // A word is no more reachable than the topic page holding it.
        add(entry.button, Math.max(entry.level, topicLevel) as VocabularyLevel)
      }

      // "More" occupies the final content cell — a fixed position, so it does
      // not move as a topic grows.
      const next = chunks[chunkIndex + 1]
      if (next) {
        const nextPageId = `${topicIds.get(topic)!}-${chunkIndex + 2}`
        const reachableAt = Math.max(
          topicLevel,
          Math.min(...next.map((word) => word[2])),
        ) as VocabularyLevel
        add(
          makeButton(
            lang,
            pageId,
            CHROME[lang].more,
            'category',
            layout.rows - 1,
            layout.columns - 1,
            [{ type: 'navigate', pageId: nextPageId }],
            true,
            now,
          ),
          reachableAt,
        )
      }
    })
  }

  // A topic whose slug matches the home page (a topic literally called
  // "Home") would silently seed that page twice. Ids are derived from labels,
  // so this has to be caught at build time rather than discovered as
  // duplicated buttons on a board.
  const pageIds = new Set<string>()
  for (const page of pages) {
    if (pageIds.has(page.id)) {
      throw new Error(
        `Duplicate page id "${page.id}" in the ${lang}/${size} layout — rename the topic whose slug collides.`,
      )
    }
    pageIds.add(page.id)
  }

  return { pageSet, pages, buttons, levels }
}

// ---------------------------------------------------------------------------
// Level map — derived from the same builder that seeds, so it cannot drift.

let levelCache: Map<string, VocabularyLevel> | null = null

function allLevels(): Map<string, VocabularyLevel> {
  if (levelCache) return levelCache
  const merged = new Map<string, VocabularyLevel>()
  for (const lang of LANGUAGE_CODES) {
    for (const size of SIZE_KEYS) {
      for (const [id, level] of buildSet(lang, size, 0).levels) merged.set(id, level)
    }
  }
  levelCache = merged
  return merged
}

/** (language, size) of a built-in core page set, or null if it is not one. */
function locate(pageSetId: string): { lang: LanguageCode; size: string } | null {
  for (const lang of LANGUAGE_CODES) {
    for (const size of SIZE_KEYS) {
      if (setIdFor(lang, size) === pageSetId) return { lang, size }
    }
  }
  return null
}

/** Level at which a built-in button appears; user-created buttons are always 1. */
export function levelOfButton(buttonId: string): VocabularyLevel {
  return allLevels().get(buttonId) ?? 1
}

/** How many distinct levels a page set actually uses (1 = no level choice). */
export function levelCountForPageSet(pageSetId: string): number {
  const found = locate(pageSetId)
  if (!found) return 1
  return new Set(buildSet(found.lang, found.size, 0).levels.values()).size
}

/** Width of the persistent core region for a built-in set; 0 if not one. */
export function coreColumnsForPageSet(pageSetId: string): number {
  const found = locate(pageSetId)
  return found ? LAYOUTS[found.lang][found.size].coreColumns : 0
}

// §19.5 Quick Phrases — 18 one-tap complete utterances, 3×6 single page.
// The Spanish set is not a translation: `¿Me ayudas?` and `Me toca a mí` are
// what a Spanish-speaking child actually says, and Spanish opens questions
// with an inverted mark, which the TTS needs in order to get the intonation
// right.
const QUICK_PHRASES: Record<LanguageCode, Array<[string, PartOfSpeech]>> = {
  en: [
    ['Hello!', 'social'],
    ['Goodbye!', 'social'],
    ['How are you?', 'question'],
    ['Thank you!', 'social'],
    ['Please!', 'social'],
    ['I like that!', 'social'],
    ['I need help.', 'little'],
    ['I need a break.', 'little'],
    ['Can I have more?', 'question'],
    ['I need the bathroom.', 'little'],
    ["That's funny!", 'social'],
    ["That's great!", 'social'],
    ["I don't like that.", 'descriptor'],
    ['Look at this!', 'social'],
    ["That's not what I meant.", 'descriptor'],
    ['Something else.', 'descriptor'],
    ['Come here please!', 'social'],
    ['Something is wrong!', 'question'],
  ],
  es: [
    ['¡Hola!', 'social'],
    ['¡Adiós!', 'social'],
    ['¿Qué tal?', 'question'],
    ['¡Gracias!', 'social'],
    ['¡Por favor!', 'social'],
    ['¡Me gusta!', 'social'],
    ['Necesito ayuda.', 'little'],
    ['Necesito un descanso.', 'little'],
    ['¿Me das más?', 'question'],
    ['Tengo que ir al baño.', 'little'],
    ['¡Qué gracioso!', 'social'],
    ['¡Qué bien!', 'social'],
    ['No me gusta.', 'descriptor'],
    ['¡Mira esto!', 'social'],
    ['No quería decir eso.', 'descriptor'],
    ['Otra cosa.', 'descriptor'],
    ['¡Ven aquí, por favor!', 'social'],
    ['¡Algo va mal!', 'question'],
  ],
  // Polish stock phrases deliberately avoid the past tense: it is marked for
  // the speaker's gender, so a single fixed set would misgender half its
  // users. Everything here is present tense or nominal.
  pl: [
    ['Cześć!', 'social'],
    ['Do widzenia!', 'social'],
    ['Jak się masz?', 'question'],
    ['Dziękuję!', 'social'],
    ['Proszę!', 'social'],
    ['Podoba mi się!', 'social'],
    ['Potrzebuję pomocy.', 'little'],
    ['Potrzebuję przerwy.', 'little'],
    ['Mogę prosić więcej?', 'question'],
    ['Muszę do łazienki.', 'little'],
    ['Śmieszne!', 'social'],
    ['Super!', 'social'],
    ['Nie podoba mi się.', 'descriptor'],
    ['Zobacz to!', 'social'],
    ['Nie o to mi chodzi.', 'descriptor'],
    ['Coś innego.', 'descriptor'],
    ['Chodź tu, proszę!', 'social'],
    ['Coś jest nie tak!', 'question'],
  ],
}

const SEED_META_KEY = 'coreVocabularySeeded'
const SEED_VERSION_KEY = 'seedVersion'
// Bump when bundled content changes. From v6 on, a bump runs a
// data-preserving migration (rebuildBuiltInContent) — NOT a wipe.
// v11 adds the Spanish boards and Frases rápidas (§19.7); English ids are
// untouched, so existing profiles and word lists migrate in place.
const SEED_VERSION = '11'

export async function seedIfNeeded(storage: Storage): Promise<string> {
  const existing = await storage.getMeta(SEED_META_KEY)
  const version = await storage.getMeta(SEED_VERSION_KEY)
  if (existing === CORE_SET_ID && version === SEED_VERSION) return CORE_SET_ID

  if (existing && existing !== CORE_SET_ID) {
    // Pre-stable-id install (random uuids from ≤ v5) → one final clean
    // reset to adopt stable ids. This is the last wipe; there are no
    // real users yet, and every future update is gentle.
    await storage.clearAll()
    await createBuiltInSets(storage)
  } else if (existing) {
    // Stable-id install, content changed → migrate in place, keeping
    // profiles, word lists, tracking, and user-created pages.
    await rebuildBuiltInContent(storage)
  } else {
    await createBuiltInSets(storage) // first run
  }

  await storage.setMeta(SEED_VERSION_KEY, SEED_VERSION)
  return CORE_SET_ID
}

// Migration + "restore defaults" safety net. Rebuilds ONLY the built-in
// pages/buttons (isBuiltIn) from the current seed, leaving user-created
// pages (isBuiltIn=false), profiles, word lists, and tracking intact.
// Because built-in ids are stable, links and references survive.
export async function rebuildBuiltInContent(storage: Storage): Promise<string> {
  for (const set of (await storage.getPageSets()).filter((s) => s.isBuiltIn)) {
    for (const page of await storage.getPagesForPageSet(set.id)) {
      if (page.isBuiltIn) await storage.deletePage(page.id) // keep user pages
    }
  }

  await createBuiltInSets(storage) // upserts set rows + built-in pages/buttons

  // Defensive: if a profile pointed at a set that no longer exists,
  // send it to Core (shouldn't happen with stable ids).
  const ids = new Set((await storage.getPageSets()).map((s) => s.id))
  for (const user of await storage.getUsers()) {
    if (!ids.has(user.activePageSetId)) {
      await storage.updateUser({
        ...user,
        activePageSetId: CORE_SET_ID,
        updatedAt: Date.now(),
      })
    }
  }

  return CORE_SET_ID
}

// Back-compat alias — Settings still calls this name for "restore".
export const restoreBuiltInPageSets = rebuildBuiltInContent

async function createBuiltInSets(storage: Storage): Promise<string> {
  const now = Date.now()

  // Every language's boards are seeded, not just the active one: switching a
  // profile's language must not require a re-seed, and a family with an
  // English-speaking sibling and a Spanish-speaking one shares one device.
  for (const lang of LANGUAGE_CODES) {
    for (const size of SIZE_KEYS) {
      const { pageSet, pages, buttons } = buildSet(lang, size, now)
      await storage.createPageSet(pageSet)
      for (const page of pages) await storage.createPage(page)
      for (const button of buttons) await storage.createButton(button)
    }
    await seedQuickPhrases(storage, lang, now)
  }

  await storage.setMeta(SEED_META_KEY, CORE_SET_ID)

  return CORE_SET_ID
}

// §19.5: each button speaks its full sentence in one tap, bypassing the
// message bar
async function seedQuickPhrases(
  storage: Storage,
  lang: LanguageCode,
  now: number,
): Promise<void> {
  const pageSetId = quickSetIdFor(lang)
  const pageId = `${pageSetId}-page`
  await storage.setMeta(quickPhrasesMetaKey(lang), pageSetId) // toolbar jump

  await storage.createPageSet({
    id: pageSetId,
    name: CHROME[lang].quickPhrases,
    description: CHROME[lang].quickDescription,
    language: lang,
    rootPageId: pageId,
    schemaVersion: 1,
    isBuiltIn: true,
    createdAt: now,
    updatedAt: now,
  })

  await storage.createPage({
    id: pageId,
    pageSetId,
    name: CHROME[lang].quickPhrases,
    rows: 3,
    columns: 6,
    backgroundColor: '#FFFFFF',
    showMessageBar: true,
    showToolbar: true,
    isBuiltIn: true,
    createdAt: now,
    updatedAt: now,
  })

  const phrases = QUICK_PHRASES[lang]
  for (let i = 0; i < phrases.length; i++) {
    const [label, pos] = phrases[i]
    await storage.createButton(
      makeButton(
        lang,
        pageId,
        label,
        pos,
        Math.floor(i / 6),
        i % 6,
        [{ type: 'speak_label' }],
        false,
        now,
      ),
    )
  }
}
