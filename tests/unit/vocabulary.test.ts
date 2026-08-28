import { POS_COLORS } from '../../src/constants/colors'
import {
  CORE_SET_ID,
  DEFAULT_SIZE,
  LANGUAGE_CODES,
  SIZE_KEYS,
  builtInCoreSetId,
  chromeLabels,
  coreColumnsForPageSet,
  layoutFor,
  levelCountForPageSet,
  levelOfButton,
} from '../../src/data/seedCoreVocabulary'
import type { Button, Page, PageSet, UserProfile, WordList } from '../../src/types/models'
import type { Storage } from '../../src/storage/types'

// Collects what the seed writes, so the authored layouts can be asserted
// without a database.
function collector() {
  const pageSets: PageSet[] = []
  const pages: Page[] = []
  const buttons: Button[] = []
  const meta: Record<string, string> = {}
  const api = {
    getMeta: async (k: string) => meta[k] ?? null,
    setMeta: async (k: string, v: string) => void (meta[k] = v),
    getUsers: async () => [] as UserProfile[],
    updateUser: async () => {},
    getPageSets: async () => pageSets,
    createPageSet: async (p: PageSet) => void pageSets.push(p),
    getPagesForPageSet: async (id: string) => pages.filter((p) => p.pageSetId === id),
    createPage: async (p: Page) => void pages.push(p),
    deletePage: async () => {},
    createButton: async (b: Button) => void buttons.push(b),
    createWordList: async (_: WordList) => {},
    clearAll: async () => {},
  }
  return { storage: api as unknown as Storage, pageSets, pages, buttons }
}

async function seed() {
  const c = collector()
  const { seedIfNeeded } = await import('../../src/data/seedCoreVocabulary')
  await seedIfNeeded(c.storage)
  return c
}

// Every (language, size) pair the app ships. Grid dimensions no longer
// identify a board — English and Spanish author the same three sizes — so
// these tests address sets by id and read labels through chromeLabels().
const BOARDS = LANGUAGE_CODES.flatMap((lang) =>
  SIZE_KEYS.map((size) => ({
    lang,
    size,
    id: builtInCoreSetId(lang, size),
    layout: layoutFor(lang, size) as any,
    chrome: chromeLabels(lang),
    name: `${lang}/${size}`,
  })),
)

describe('authored sizes', () => {
  it('ships more than one, and 5x6 keeps the id it shipped with', () => {
    expect(SIZE_KEYS.length).toBeGreaterThan(1)
    expect(DEFAULT_SIZE).toBe('5x6')
    // Changing this breaks every existing profile, word list and user page.
    expect(CORE_SET_ID).toBe('builtin-core-vocabulary')
  })

  it('gives every size in every language its own page set', async () => {
    const { pageSets } = await seed()
    const coreSets = pageSets.filter((s) => coreColumnsForPageSet(s.id) > 0)
    const expected = SIZE_KEYS.length * LANGUAGE_CODES.length
    expect(coreSets).toHaveLength(expected)
    expect(new Set(coreSets.map((s) => s.id)).size).toBe(expected)
    // Every language ships the full range of sizes, not a reduced one.
    for (const lang of LANGUAGE_CODES) {
      expect(coreSets.filter((s) => s.language === lang)).toHaveLength(SIZE_KEYS.length)
    }
  })

  it('never places a button outside its grid', async () => {
    const { pages, buttons } = await seed()
    const byId = new Map(pages.map((p) => [p.id, p]))
    for (const button of buttons) {
      const page = byId.get(button.pageId)!
      expect(button.row).toBeLessThan(page.rows)
      expect(button.column).toBeLessThan(page.columns)
      expect(button.row).toBeGreaterThanOrEqual(0)
      expect(button.column).toBeGreaterThanOrEqual(0)
    }
  })

  it('puts at most one button in any cell', async () => {
    const { buttons } = await seed()
    const seen = new Set<string>()
    for (const b of buttons) {
      const cell = `${b.pageId}-${b.row}-${b.column}`
      expect(seen.has(cell)).toBe(false)
      seen.add(cell)
    }
  })
})

// §19.6 release gate: "the core region is identical (labels + positions)
// across all pages". Now asserted per authored size.
describe('§19.6 persistent core region', () => {
  it.each(BOARDS.map((b) => [b.name, b] as const))(
    'is identical on every page of the %s set',
    async (_name, board) => {
    const { pages, buttons } = await seed()
    const setPages = pages.filter((p) => p.pageSetId === board.id)
    expect(setPages.length).toBeGreaterThan(1)

    const coreColumns = board.layout.coreColumns
    const signature = (pageId: string) =>
      buttons
        .filter((b) => b.pageId === pageId && b.column < coreColumns)
        .sort((a, b) => a.row - b.row || a.column - b.column)
        .map((b) => `${b.row},${b.column}:${b.label}`)
        .join('|')

    const first = signature(setPages[0].id)
    expect(first).not.toBe('')
    for (const page of setPages) expect(signature(page.id)).toBe(first)
    },
  )
})

// The 15th Actions word used to vanish: placeWords drops anything past the
// last row, so a topic that outgrew its page lost words with no warning.
describe('topic overflow', () => {
  it('gives every authored word a button on its own board', async () => {
    const { pages, buttons } = await seed()
    const setOfPage = new Map(pages.map((p) => [p.id, p.pageSetId]))
    for (const board of BOARDS) {
      // Scoped to THIS board: a word that only made it onto some other
      // language's board is still a word this one lost.
      const placed = new Set(
        buttons
          .filter((b) => setOfPage.get(b.pageId) === board.id)
          .map((b) => b.label),
      )
      expect(placed.size).toBeGreaterThan(0)
      for (const [topic, words] of Object.entries<any>(board.layout.topics)) {
        for (const word of words) {
          expect({ board: board.name, topic, word: word[0], placed: placed.has(word[0]) })
            .toEqual({ board: board.name, topic, word: word[0], placed: true })
        }
      }
    }
  })

  // Overflow is a SAFETY NET, not a feature to aim for: a word behind "More"
  // costs a third selection, and §19.1 wants at most two. So these assert it is
  // correct WHEN it happens, rather than requiring it to happen.
  it('links every More button to a real page', async () => {
    const { pages, buttons } = await seed()
    const pageIds = new Set(pages.map((p) => p.id))
    const moreLabels = new Set(LANGUAGE_CODES.map((l) => chromeLabels(l).more))
    for (const button of buttons.filter((b) => moreLabels.has(b.label))) {
      const target = button.actions.find((a) => a.type === 'navigate')
      expect(target).toBeTruthy()
      expect(pageIds.has((target as { pageId: string }).pageId)).toBe(true)
    }
  })

  it('keeps the core region and a Back button on any overflow page', async () => {
    const { pages, buttons } = await seed()
    for (const page of pages.filter((p) => /-\d+$/.test(p.id))) {
      const onPage = buttons.filter((b) => b.pageId === page.id)
      const coreColumns = coreColumnsForPageSet(page.pageSetId)
      expect(onPage.filter((b) => b.column < coreColumns).length).toBe(
        coreColumns * page.rows,
      )
      expect(onPage.some((b) => b.actions.some((a) => a.type === 'navigate_back'))).toBe(
        true,
      )
    }
  })

  // §19.1 principle 2. Overshooting the navigation slots pushes topics onto a
  // second home page, putting those words three selections away — which is how
  // an over-eager vocabulary expansion silently degrades the board.
  it('reaches every topic in at most two selections', async () => {
    const { pages, buttons } = await seed()
    for (const board of BOARDS) {
      const extraHomePages = pages.filter(
        (p) => p.pageSetId === board.id && p.name.startsWith(`${board.chrome.home} `),
      )
      expect({ board: board.name, extra: extraHomePages.length })
        .toEqual({ board: board.name, extra: 0 })
      // ...which means every topic fits in the home page's navigation slots.
      const { rows, columns, coreColumns, topics } = board.layout
      const slots = rows * (columns - coreColumns) - 1
      expect(Object.keys(topics).length).toBeLessThanOrEqual(slots)
    }
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('leaves a free cell on every core-board page for personalisation', async () => {
    const { pages, buttons } = await seed()
    // Core boards only. Quick Phrases is 18 phrases on a 3×6 grid — full by
    // design (§19.5), not a board the user grows.
    const corePages = pages.filter((p) => coreColumnsForPageSet(p.pageSetId) > 0)
    expect(corePages.length).toBeGreaterThan(0)
    for (const page of corePages) {
      const used = buttons.filter((b) => b.pageId === page.id).length
      // A board filled to 100% cannot have the user's own words added to it.
      expect(used).toBeLessThan(page.rows * page.columns)
    }
  })

  it('reaches every topic from a home page', async () => {
    const { pages, buttons } = await seed()
    for (const board of BOARDS) {
      const homePages = pages.filter(
        (p) => p.pageSetId === board.id && p.name.startsWith(board.chrome.home),
      )
      expect(homePages.length).toBeGreaterThan(0)
      const navs = buttons.filter(
        (b) =>
          homePages.some((p) => p.id === b.pageId) &&
          b.isNavigationButton &&
          b.label !== board.chrome.more,
      )
      // Every topic is reachable, and no home page is overfilled.
      expect({ board: board.name, navs: navs.length }).toEqual({
        board: board.name,
        navs: Object.keys(board.layout.topics).length,
      })
      for (const home of homePages) {
        const onPage = buttons.filter((b) => b.pageId === home.id)
        expect(onPage.length).toBeLessThanOrEqual(home.rows * home.columns)
      }
    }
  })
})

// §19.4 — core vocabulary works in ANY context; topic vocabulary is
// context-specific. Reaching for "again" is a different job from reaching for
// "giraffe", so the two must not read as peers on the home page.
describe('core pages vs topic pages', () => {
  it('puts core pages before topic pages', async () => {
    const { pages, buttons } = await seed()
    for (const board of BOARDS) {
      const core = Object.keys(board.layout.corePages ?? {})
      if (!core.length) continue
      const home = pages.find(
        (p) => p.pageSetId === board.id && p.name === board.chrome.home,
      )!
      const navs = buttons
        .filter(
          (b) =>
            b.pageId === home.id &&
            b.isNavigationButton &&
            b.label !== board.chrome.more,
        )
        .sort((a, b) => a.row - b.row || a.column - b.column)
        .map((b) => b.label)
      // Every core page appears before the first topic page.
      const lastCore = Math.max(...core.map((c) => navs.indexOf(c)))
      const firstTopic = navs.findIndex((n) => !core.includes(n))
      expect({ board: board.name, ok: lastCore < firstTopic })
        .toEqual({ board: board.name, ok: true })
    }
  })

  it('colours a core page button like the words behind it', async () => {
    const { buttons } = await seed()
    const byLabel = new Map(
      buttons.filter((b) => b.isNavigationButton).map((b) => [b.label, b]),
    )
    // Green leads to verbs, purple to describing words, pink to social —
    // the Fitzgerald coding carries meaning, so it must hold in every
    // language, not just the one the board was first authored in.
    expect(byLabel.get('Actions')!.backgroundColor).toBe(POS_COLORS.verb)
    expect(byLabel.get('Acciones')!.backgroundColor).toBe(POS_COLORS.verb)
    expect(byLabel.get('Describing')!.backgroundColor).toBe(POS_COLORS.descriptor)
    expect(byLabel.get('Describir')!.backgroundColor).toBe(POS_COLORS.descriptor)
    expect(byLabel.get('Social')!.backgroundColor).toBe(POS_COLORS.social)
    // Topic pages stay category grey.
    expect(byLabel.get('Food')!.backgroundColor).toBe(POS_COLORS.category)
    expect(byLabel.get('Comida')!.backgroundColor).toBe(POS_COLORS.category)
    expect(byLabel.get('Animals')!.backgroundColor).toBe(POS_COLORS.category)
    expect(byLabel.get('Animales')!.backgroundColor).toBe(POS_COLORS.category)
  })

  it('keeps core pages reachable at every vocabulary level', async () => {
    const { pages, buttons } = await seed()
    for (const board of BOARDS) {
      const setPageIds = new Set(
        pages.filter((p) => p.pageSetId === board.id).map((p) => p.id),
      )
      for (const page of Object.keys(board.layout.corePages ?? {})) {
        const nav = buttons.find(
          (b) => setPageIds.has(b.pageId) && b.isNavigationButton && b.label === page,
        )!
        // Level 1 = introduced from the start; core is not something to unlock.
        expect({ board: board.name, page, level: levelOfButton(nav.id) })
          .toEqual({ board: board.name, page, level: 1 })
      }
    }
  })
})

describe('vocabulary levels', () => {
  it('keeps core available at every level', async () => {
    const { pages, buttons } = await seed()
    const byId = new Map(pages.map((p) => [p.id, p]))
    const core = buttons.filter((b) => {
      const page = byId.get(b.pageId)!
      return b.column < coreColumnsForPageSet(page.pageSetId)
    })
    expect(core.length).toBeGreaterThan(0)
    for (const button of core) expect(levelOfButton(button.id)).toBe(1)
  })

  it('never hides the way back off a topic page', async () => {
    const { buttons } = await seed()
    const backs = buttons.filter((b) =>
      b.actions.some((a) => a.type === 'navigate_back'),
    )
    expect(backs.length).toBeGreaterThan(0)
    for (const back of backs) expect(levelOfButton(back.id)).toBe(1)
  })

  it('raising the level only reveals words — it never moves one', async () => {
    const { buttons } = await seed()
    const positionAt = (level: number) =>
      buttons
        .filter((b) => levelOfButton(b.id) <= level)
        .map((b) => `${b.id}@${b.row},${b.column}`)

    const basic = positionAt(1)
    const full = positionAt(3)
    // Every position visible at Basic is unchanged at Full...
    for (const entry of basic) expect(full).toContain(entry)
    // ...and Full genuinely shows more.
    expect(full.length).toBeGreaterThan(basic.length)
  })

  it('does not offer a level choice on a board with only one level', () => {
    // The simplified board is already minimal, so its control is hidden.
    expect(levelCountForPageSet('builtin-core-3x4')).toBe(1)
    expect(levelCountForPageSet(CORE_SET_ID)).toBeGreaterThan(1)
  })

  it('treats a word as reachable only once its topic page is', async () => {
    const { pages, buttons } = await seed()
    const topicPages = pages.filter((p) => p.name !== 'Home')
    for (const page of topicPages) {
      const nav = buttons.find(
        (b) => b.actions.some((a) => a.type === 'navigate' && a.pageId === page.id),
      )
      if (!nav) continue
      const navLevel = levelOfButton(nav.id)
      const words = buttons.filter(
        (b) =>
          b.pageId === page.id &&
          b.column >= coreColumnsForPageSet(page.pageSetId) &&
          !b.actions.some((a) => a.type === 'navigate_back'),
      )
      for (const word of words) {
        expect(levelOfButton(word.id)).toBeGreaterThanOrEqual(navLevel)
      }
    }
  })

  it('defaults unknown (user-created) buttons to always visible', () => {
    expect(levelOfButton('some-user-created-uuid')).toBe(1)
  })
})
