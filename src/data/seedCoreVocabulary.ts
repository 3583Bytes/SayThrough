import { POS_COLORS, PartOfSpeech, UI_COLORS } from '../constants/colors'
import type { Storage } from '../storage/types'
import type { Button, ButtonAction, Page, PageSet } from '../types/models'
import coreWordsJson from './coreWords.json'
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

const SIZES = coreWordsJson.sizes as unknown as Record<string, SizeLayout>
const SYMBOL_MAP = seedSymbolMapJson as Record<string, string>

/** The size whose ids shipped first; it keeps them for back-compatibility. */
export const DEFAULT_SIZE = '5x6'
export const SIZE_KEYS = Object.keys(SIZES)

const QUICK_SET_ID = 'builtin-quick-phrases'
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

// The 5×6 set predates multi-size support and must keep the exact ids it
// shipped with, or existing profiles, word lists and user pages would all
// point at rows that no longer exist.
const setIdFor = (size: string) =>
  size === DEFAULT_SIZE ? 'builtin-core-vocabulary' : `builtin-core-${size}`
const homeIdFor = (size: string) =>
  size === DEFAULT_SIZE ? 'builtin-core-home' : `builtin-core-${size}-home`
const topicIdFor = (size: string, topic: string) =>
  size === DEFAULT_SIZE
    ? `builtin-core-${slug(topic)}`
    : `builtin-core-${size}-${slug(topic)}`

export const CORE_SET_ID = setIdFor(DEFAULT_SIZE)

function makeButton(
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
    symbolId: SYMBOL_MAP[label],
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
function makeBackButton(pageId: string, coreColumns: number, now: number): Button {
  return {
    ...makeButton(
      pageId,
      'Back',
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
function buildSet(size: string, now: number): BuiltSet {
  const layout = SIZES[size]
  const pageSetId = setIdFor(size)
  const homePageId = homeIdFor(size)
  const contentColumns = layout.columns - layout.coreColumns
  const topicIds = new Map(
    Object.keys(layout.topics).map((t) => [t, topicIdFor(size, t)]),
  )

  const pageSet: PageSet = {
    id: pageSetId,
    name: layout.name,
    description: `Bundled starter vocabulary, ${layout.rows}×${layout.columns} (§19) — pending SLP review`,
    language: 'en',
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
  const pages: Page[] = [makePage(homePageId, 'Home')]
  const buttons: Button[] = []
  const levels = new Map<string, VocabularyLevel>()

  const add = (button: Button, level: VocabularyLevel) => {
    buttons.push(button)
    levels.set(button.id, level)
  }

  // Core region — identical on every page (home + topics)
  for (const pageId of [homePageId, ...topicIds.values()]) {
    for (const entry of placeWords(
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
      add(makeBackButton(pageId, layout.coreColumns, now), 1)
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
          pageId,
          'More',
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

      add(makeBackButton(pageId, layout.coreColumns, now), 1) // always the way out

      for (const entry of placeWords(
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
            pageId,
            'More',
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
        `Duplicate page id "${page.id}" in the ${size} layout — rename the topic whose slug collides.`,
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
  for (const size of SIZE_KEYS) {
    for (const [id, level] of buildSet(size, 0).levels) merged.set(id, level)
  }
  levelCache = merged
  return merged
}

/** Level at which a built-in button appears; user-created buttons are always 1. */
export function levelOfButton(buttonId: string): VocabularyLevel {
  return allLevels().get(buttonId) ?? 1
}

/** How many distinct levels a page set actually uses (1 = no level choice). */
export function levelCountForPageSet(pageSetId: string): number {
  const size = SIZE_KEYS.find((key) => setIdFor(key) === pageSetId)
  if (!size) return 1
  return new Set(buildSet(size, 0).levels.values()).size
}

/** Width of the persistent core region for a built-in set; 0 if not one. */
export function coreColumnsForPageSet(pageSetId: string): number {
  const size = SIZE_KEYS.find((key) => setIdFor(key) === pageSetId)
  return size ? SIZES[size].coreColumns : 0
}

// §19.5 Quick Phrases — 18 one-tap complete utterances, 3×6 single page
const QUICK_PHRASES: Array<[string, PartOfSpeech]> = [
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
]

const SEED_META_KEY = 'coreVocabularySeeded'
const SEED_VERSION_KEY = 'seedVersion'
// Bump when bundled content changes. From v6 on, a bump runs a
// data-preserving migration (rebuildBuiltInContent) — NOT a wipe.
const SEED_VERSION = '10'

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

  for (const size of SIZE_KEYS) {
    const { pageSet, pages, buttons } = buildSet(size, now)
    await storage.createPageSet(pageSet)
    for (const page of pages) await storage.createPage(page)
    for (const button of buttons) await storage.createButton(button)
  }

  await seedQuickPhrases(storage, now)
  await storage.setMeta(SEED_META_KEY, CORE_SET_ID)

  return CORE_SET_ID
}

// §19.5: each button speaks its full sentence in one tap, bypassing the
// message bar
async function seedQuickPhrases(storage: Storage, now: number): Promise<void> {
  const pageSetId = QUICK_SET_ID
  const pageId = `${QUICK_SET_ID}-page`
  await storage.setMeta('quickPhrasesPageSetId', pageSetId) // toolbar jump

  await storage.createPageSet({
    id: pageSetId,
    name: 'Quick Phrases',
    description: 'Pre-stored phrases spoken with one tap (§19.5)',
    language: 'en',
    rootPageId: pageId,
    schemaVersion: 1,
    isBuiltIn: true,
    createdAt: now,
    updatedAt: now,
  })

  await storage.createPage({
    id: pageId,
    pageSetId,
    name: 'Quick Phrases',
    rows: 3,
    columns: 6,
    backgroundColor: '#FFFFFF',
    showMessageBar: true,
    showToolbar: true,
    isBuiltIn: true,
    createdAt: now,
    updatedAt: now,
  })

  for (let i = 0; i < QUICK_PHRASES.length; i++) {
    const [label, pos] = QUICK_PHRASES[i]
    await storage.createButton(
      makeButton(
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
