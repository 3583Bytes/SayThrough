import {
  rebuildBuiltInContent,
  seedIfNeeded,
} from '../../src/data/seedCoreVocabulary'
import type { Storage } from '../../src/storage/types'
import type { Button, Page, PageSet, UserProfile } from '../../src/types/models'

// Minimal in-memory Storage covering what seeding + migration touch.
// Proves the promise: a content update rebuilds built-in content while
// leaving profiles, word lists, and user-created pages intact.
class FakeStorage {
  meta = new Map<string, string>()
  pageSets = new Map<string, PageSet>()
  pages = new Map<string, Page>()
  buttons = new Map<string, Button>()
  users = new Map<string, UserProfile>()
  wordLists = new Map<string, { id: string; userId: string; name: string }>()

  async getMeta(k: string) {
    return this.meta.get(k) ?? null
  }
  async setMeta(k: string, v: string) {
    this.meta.set(k, v)
  }
  async clearAll() {
    this.pageSets.clear()
    this.pages.clear()
    this.buttons.clear()
    this.users.clear()
    this.wordLists.clear()
    this.meta.clear()
  }
  async getPageSets() {
    return [...this.pageSets.values()]
  }
  async getPageSet(id: string) {
    return this.pageSets.get(id) ?? null
  }
  async createPageSet(ps: PageSet) {
    this.pageSets.set(ps.id, ps)
  }
  async deletePageSet(id: string) {
    this.pageSets.delete(id)
  }
  async getPage(id: string) {
    return this.pages.get(id) ?? null
  }
  async getPagesForPageSet(pageSetId: string) {
    return [...this.pages.values()].filter((p) => p.pageSetId === pageSetId)
  }
  async createPage(p: Page) {
    this.pages.set(p.id, p)
  }
  async updatePage(p: Page) {
    this.pages.set(p.id, p)
  }
  async deletePage(id: string) {
    this.pages.delete(id)
    for (const b of [...this.buttons.values()]) if (b.pageId === id) this.buttons.delete(b.id)
  }
  async getButtonsForPage(pageId: string) {
    return [...this.buttons.values()].filter((b) => b.pageId === pageId)
  }
  async createButton(b: Button) {
    this.buttons.set(b.id, b)
  }
  async updateButton(b: Button) {
    this.buttons.set(b.id, b)
  }
  async deleteButton(id: string) {
    this.buttons.delete(id)
  }
  async getUsers() {
    return [...this.users.values()]
  }
  async createUser(u: UserProfile) {
    this.users.set(u.id, u)
  }
  async updateUser(u: UserProfile) {
    this.users.set(u.id, u)
  }
  async getWordLists(userId: string) {
    return [...this.wordLists.values()].filter((w) => w.userId === userId) as never
  }
  async createWordList(w: { id: string; userId: string; name: string }) {
    this.wordLists.set(w.id, w)
  }
}

const fake = () => new FakeStorage() as unknown as Storage & FakeStorage

describe('seed + migration (data preservation)', () => {
  test('first run seeds Core + Quick with stable ids', async () => {
    const s = fake()
    const coreId = await seedIfNeeded(s)
    expect(coreId).toBe('builtin-core-vocabulary')
    expect(await s.getMeta('coreVocabularySeeded')).toBe('builtin-core-vocabulary')
    expect(await s.getMeta('quickPhrasesPageSetId')).toBe('builtin-quick-phrases')
    // Home page has the persistent core words
    const home = await s.getButtonsForPage('builtin-core-home')
    expect(home.some((b) => b.label === 'want')).toBe(true)
  })

  test('a content update preserves profiles, word lists, and user pages', async () => {
    const s = fake()
    const coreId = await seedIfNeeded(s)

    // simulate real usage: a profile, a user-created page + button, a list
    await s.createUser({
      id: 'u1',
      name: 'Maya',
      activePageSetId: coreId,
      language: 'en-US',
      ttsRate: 0.9,
      ttsPitch: 1,
      ttsVolume: 1,
      speakOnSelect: false,
      editPinHash: 'hash',
      editPinSalt: 'salt',
      createdAt: 1,
      updatedAt: 1,
    })
    await s.createPage({
      id: 'user-minecraft',
      pageSetId: coreId, // user pages live in the Core set
      name: 'Minecraft',
      rows: 5,
      columns: 6,
      backgroundColor: '#FFFFFF',
      showMessageBar: true,
      showToolbar: true,
      isBuiltIn: false,
      createdAt: 1,
      updatedAt: 1,
    })
    await s.createButton({
      id: 'user-btn-creeper',
      pageId: 'user-minecraft',
      row: 0,
      column: 3,
      rowSpan: 1,
      columnSpan: 1,
      label: 'creeper',
      backgroundColor: '#FFFFFF',
      borderColor: '#DDD',
      borderWidth: 1,
      labelColor: '#000',
      labelFontSize: 14,
      labelFontWeight: 'bold',
      symbolScale: 0.65,
      isHidden: false,
      isNavigationButton: false,
      actions: [{ type: 'append_to_message' }],
      isBuiltIn: false,
      createdAt: 1,
      updatedAt: 1,
    })
    await s.createWordList({ id: 'wl1', userId: 'u1', name: 'Week 1' })

    // content update
    await rebuildBuiltInContent(s)

    // user data survives
    expect(await s.getPage('user-minecraft')).not.toBeNull()
    expect((await s.getButtonsForPage('user-minecraft')).some((b) => b.label === 'creeper')).toBe(true)
    const user = (await s.getUsers())[0]
    expect(user.name).toBe('Maya')
    expect(user.editPinHash).toBe('hash') // PIN kept
    expect(user.activePageSetId).toBe(coreId) // still valid (stable id)
    expect((await s.getWordLists('u1')).length).toBe(1)

    // built-in content is present and correct
    expect((await s.getButtonsForPage('builtin-core-home')).some((b) => b.label === 'want')).toBe(true)
  })
})
