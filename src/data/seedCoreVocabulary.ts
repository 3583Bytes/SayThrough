import { POS_COLORS, PartOfSpeech, UI_COLORS } from '../constants/colors'
import type { Storage } from '../storage/types'
import type { Button, ButtonAction, Page, PageSet } from '../types/models'
import { uuid } from '../utils/uuid'

// Seeds the bundled Core Vocabulary page set per §19: a 5×6 grid where
// columns 0–2 are the persistent core region — identical words at
// identical positions on EVERY page (§19.5 acceptance criterion) — and
// columns 3–5 hold page-specific content: topic-navigation buttons on
// the home page, topic words on topic pages.
//
// Word lists are the §19.3 candidate set, pending SLP validation.
// TODO(§19.5): replace with SLP-reviewed .obf content before v1.0.

type Word = [string, PartOfSpeech]

// §19.3 persistent core — row-major across columns 0–2
const CORE_WORDS: Word[] = [
  ['I', 'pronoun'],
  ['you', 'pronoun'],
  ['it', 'pronoun'],
  ['want', 'verb'],
  ['like', 'verb'],
  ['more', 'little'],
  ['go', 'verb'],
  ['help', 'verb'],
  ['stop', 'verb'],
  ['do', 'verb'],
  ['feel', 'verb'],
  ['look', 'verb'],
  ['not', 'little'],
  ['yes', 'social'],
  ['no', 'social'],
]

const TOPICS: Record<string, Word[]> = {
  Food: [
    ['eat', 'verb'],
    ['hungry', 'descriptor'],
    ['cookie', 'noun'],
    ['apple', 'noun'],
    ['banana', 'noun'],
    ['bread', 'noun'],
    ['pizza', 'noun'],
    ['cheese', 'noun'],
    ['sandwich', 'noun'],
    ['cracker', 'noun'],
    ['yogurt', 'noun'],
    ['cereal', 'noun'],
  ],
  Drinks: [
    ['drink', 'verb'],
    ['thirsty', 'descriptor'],
    ['water', 'noun'],
    ['milk', 'noun'],
    ['juice', 'noun'],
    ['smoothie', 'noun'],
  ],
  Play: [
    ['play', 'verb'],
    ['ball', 'noun'],
    ['blocks', 'noun'],
    ['puzzle', 'noun'],
    ['game', 'noun'],
    ['outside', 'noun'],
    ['swing', 'noun'],
    ['slide', 'noun'],
    ['bubbles', 'noun'],
    ['toy', 'noun'],
    ['my turn', 'social'],
    ['your turn', 'social'],
  ],
  People: [
    ['mom', 'noun'],
    ['dad', 'noun'],
    ['teacher', 'noun'],
    ['friend', 'noun'],
    ['brother', 'noun'],
    ['sister', 'noun'],
    ['grandma', 'noun'],
    ['grandpa', 'noun'],
    ['baby', 'noun'],
    ['nurse', 'noun'],
  ],
  Feelings: [
    ['happy', 'descriptor'],
    ['sad', 'descriptor'],
    ['mad', 'descriptor'],
    ['tired', 'descriptor'],
    ['scared', 'descriptor'],
    ['silly', 'descriptor'],
    ['sick', 'descriptor'],
    ['hurt', 'descriptor'],
    ['excited', 'descriptor'],
    ['calm', 'descriptor'],
    ['bored', 'descriptor'],
  ],
  Places: [
    ['home', 'noun'],
    ['school', 'noun'],
    ['park', 'noun'],
    ['store', 'noun'],
    ['bathroom', 'noun'],
    ['bed', 'noun'],
    ['car', 'noun'],
    ['doctor', 'noun'],
    ['library', 'noun'],
  ],
}

const ROWS = 5
const COLUMNS = 6

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
    id: uuid(),
    pageId,
    row,
    column,
    rowSpan: 1,
    columnSpan: 1,
    label,
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

// Places `words` row-major into columns [columnOffset, columnOffset+2]
function placeWords(
  pageId: string,
  words: Word[],
  columnOffset: number,
  actionsFor: (label: string) => ButtonAction[],
  now: number,
): Button[] {
  return words.map(([label, pos], i) =>
    makeButton(
      pageId,
      label,
      pos,
      Math.floor(i / 3),
      columnOffset + (i % 3),
      actionsFor(label),
      false,
      now,
    ),
  )
}

const SEED_META_KEY = 'coreVocabularySeeded'

export async function seedIfNeeded(storage: Storage): Promise<string> {
  const existing = await storage.getMeta(SEED_META_KEY)
  if (existing) return existing // value = pageSetId

  const now = Date.now()
  const pageSetId = uuid()
  const homePageId = uuid()
  const topicPageIds = new Map(Object.keys(TOPICS).map((t) => [t, uuid()]))

  const pageSet: PageSet = {
    id: pageSetId,
    name: 'Core Vocabulary',
    description: 'Bundled starter vocabulary (§19) — pending SLP review',
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
    rows: ROWS,
    columns: COLUMNS,
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

  // Core region — identical on every page (home + topics)
  const allPageIds = [homePageId, ...topicPageIds.values()]
  for (const pageId of allPageIds) {
    buttons.push(...placeWords(pageId, CORE_WORDS, 0, appendAction, now))
  }

  // Home page right side: topic-navigation buttons
  let navIndex = 0
  for (const [topic, pageId] of topicPageIds) {
    buttons.push(
      makeButton(
        homePageId,
        topic,
        'category',
        Math.floor(navIndex / 3),
        3 + (navIndex % 3),
        [{ type: 'navigate', pageId }],
        true,
        now,
      ),
    )
    navIndex++
  }

  // Topic pages: right side holds the topic words
  for (const [topic, words] of Object.entries(TOPICS)) {
    const pageId = topicPageIds.get(topic)!
    pages.push(makePage(pageId, topic))
    buttons.push(...placeWords(pageId, words, 3, appendAction, now))
  }

  await storage.createPageSet(pageSet)
  for (const page of pages) await storage.createPage(page)
  for (const button of buttons) await storage.createButton(button)
  await storage.setMeta(SEED_META_KEY, pageSetId)

  return pageSetId
}
