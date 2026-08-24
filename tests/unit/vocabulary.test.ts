import coreWordsJson from '../../src/data/coreWords.json'
import {
  CORE_SET_ID,
  DEFAULT_SIZE,
  SIZE_KEYS,
  coreColumnsForPageSet,
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

const layouts = (coreWordsJson as any).sizes as Record<string, any>

describe('authored sizes', () => {
  it('ships more than one, and 5x6 keeps the id it shipped with', () => {
    expect(SIZE_KEYS.length).toBeGreaterThan(1)
    expect(DEFAULT_SIZE).toBe('5x6')
    // Changing this breaks every existing profile, word list and user page.
    expect(CORE_SET_ID).toBe('builtin-core-vocabulary')
  })

  it('gives every size its own page set', async () => {
    const { pageSets } = await seed()
    const coreSets = pageSets.filter((s) => coreColumnsForPageSet(s.id) > 0)
    expect(coreSets).toHaveLength(SIZE_KEYS.length)
    expect(new Set(coreSets.map((s) => s.id)).size).toBe(SIZE_KEYS.length)
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
  it.each(SIZE_KEYS)('is identical on every page of the %s set', async (size) => {
    const { pageSets, pages, buttons } = await seed()
    const setId = pageSets.find(
      (s) => coreColumnsForPageSet(s.id) === layouts[size].coreColumns &&
        pages.some((p) => p.pageSetId === s.id && p.rows === layouts[size].rows),
    )!.id
    const setPages = pages.filter((p) => p.pageSetId === setId)
    expect(setPages.length).toBeGreaterThan(1)

    const coreColumns = layouts[size].coreColumns
    const signature = (pageId: string) =>
      buttons
        .filter((b) => b.pageId === pageId && b.column < coreColumns)
        .sort((a, b) => a.row - b.row || a.column - b.column)
        .map((b) => `${b.row},${b.column}:${b.label}`)
        .join('|')

    const first = signature(setPages[0].id)
    expect(first).not.toBe('')
    for (const page of setPages) expect(signature(page.id)).toBe(first)
  })
})

// The 15th Actions word used to vanish: placeWords drops anything past the
// last row, so a topic that outgrew its page lost words with no warning.
describe('topic overflow', () => {
  it('gives every authored word a button', async () => {
    const { buttons } = await seed()
    const placed = new Set(buttons.map((b) => b.label))
    for (const [size, layout] of Object.entries(layouts)) {
      for (const [topic, words] of Object.entries<any>(layout.topics)) {
        for (const word of words) {
          expect(placed.has(word[0])).toBe(true)
        }
        expect(topic).toBeTruthy()
      }
      expect(size).toBeTruthy()
    }
  })

  it('reaches an overflow page through a More button', async () => {
    const { pages, buttons } = await seed()
    const more = buttons.filter((b) => b.label === 'More')
    expect(more.length).toBeGreaterThan(0)
    const pageIds = new Set(pages.map((p) => p.id))
    for (const button of more) {
      const target = button.actions.find((a) => a.type === 'navigate')
      expect(target).toBeTruthy()
      // No dead links.
      expect(pageIds.has((target as { pageId: string }).pageId)).toBe(true)
    }
  })

  it('keeps the core region and a Back button on overflow pages', async () => {
    const { pages, buttons } = await seed()
    const overflow = pages.filter((p) => /-\d+$/.test(p.id))
    expect(overflow.length).toBeGreaterThan(0)
    for (const page of overflow) {
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
    for (const [, layout] of Object.entries<any>(layouts)) {
      const homePages = pages.filter(
        (p) =>
          /^Home( \d+)?$/.test(p.name) &&
          p.rows === layout.rows &&
          p.columns === layout.columns,
      )
      expect(homePages.length).toBeGreaterThan(0)
      const navs = buttons.filter(
        (b) =>
          homePages.some((p) => p.id === b.pageId) &&
          b.isNavigationButton &&
          b.label !== 'More',
      )
      // Every topic is reachable, and no home page is overfilled.
      expect(navs.length).toBe(Object.keys(layout.topics).length)
      for (const home of homePages) {
        const onPage = buttons.filter((b) => b.pageId === home.id)
        expect(onPage.length).toBeLessThanOrEqual(home.rows * home.columns)
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
