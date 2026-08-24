import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  createBackup,
  parseBackup,
  restoreBackup,
  serializeBackup,
} from '../../src/services/backupService'
import type { Storage } from '../../src/storage/types'
import type { Button, Page, PageSet, TrackingEvent, UserProfile, WordList } from '../../src/types/models'

jest.mock('../../src/services/predictionModel', () => ({
  invalidateModelCache: jest.fn(),
}))

// Minimal in-memory Storage — only the methods the backup touches.
function fakeStorage(): Storage & { dump: () => Record<string, unknown> } {
  let meta: Record<string, string> = {}
  let users: UserProfile[] = []
  let pageSets: PageSet[] = []
  let pages: Page[] = []
  let buttons: Button[] = []
  let wordLists: WordList[] = []
  let items: Array<{ wordListId: string; buttonId: string }> = []
  let events: TrackingEvent[] = []

  const api = {
    getAllMeta: async () => ({ ...meta }),
    getMeta: async (k: string) => meta[k] ?? null,
    setMeta: async (k: string, v: string) => void (meta[k] = v),
    getUsers: async () => [...users],
    createUser: async (u: UserProfile) => void users.push(u),
    getPageSets: async () => [...pageSets],
    createPageSet: async (p: PageSet) => void pageSets.push(p),
    getPagesForPageSet: async (id: string) => pages.filter((p) => p.pageSetId === id),
    createPage: async (p: Page) => void pages.push(p),
    getButtonsForPage: async (id: string) => buttons.filter((b) => b.pageId === id),
    createButton: async (b: Button) => void buttons.push(b),
    getWordLists: async (userId: string) => wordLists.filter((l) => l.userId === userId),
    createWordList: async (l: WordList) => void wordLists.push(l),
    getWordListButtonIds: async (listId: string) =>
      items.filter((i) => i.wordListId === listId).map((i) => i.buttonId),
    addWordToList: async (wordListId: string, buttonId: string) =>
      void items.push({ wordListId, buttonId }),
    getTrackingEvents: async (userId: string, since: number) =>
      events.filter((e) => e.userId === userId && e.timestamp >= since),
    logTrackingEvent: async (e: TrackingEvent) => void events.push(e),
    clearAll: async () => {
      meta = {}
      users = []
      pageSets = []
      pages = []
      buttons = []
      wordLists = []
      items = []
      events = []
    },
    dump: () => ({ meta, users, pageSets, pages, buttons, wordLists, items, events }),
  }
  return api as unknown as Storage & { dump: () => Record<string, unknown> }
}

const user = (id: string): UserProfile => ({
  id,
  name: `User ${id}`,
  activePageSetId: 'set-1',
  language: 'en-US',
  ttsRate: 0.9,
  ttsPitch: 1,
  ttsVolume: 1,
  speakOnSelect: false,
  accessMethod: 'scanning',
  scanSpeed: 1200,
  dwellTime: 800,
  editPinHash: 'hash',
  editPinSalt: 'salt',
  createdAt: 1,
  updatedAt: 1,
})

async function populate(storage: Storage) {
  await storage.setMeta('activeUserId', 'u1')
  await storage.setMeta('prediction:u1', '{"unigrams":{"juice":4},"bigrams":{}}')
  await storage.setMeta('messageHistory:u1', '{"recents":["I want juice"],"favorites":[]}')
  await storage.createUser(user('u1'))
  await storage.createPageSet({
    id: 'set-1',
    name: 'Core',
    language: 'en',
    rootPageId: 'page-1',
    schemaVersion: 1,
    isBuiltIn: true,
    createdAt: 1,
    updatedAt: 1,
  })
  await storage.createPage({
    id: 'page-1',
    pageSetId: 'set-1',
    name: 'Home',
    rows: 5,
    columns: 6,
    backgroundColor: '#FFF',
    showMessageBar: true,
    showToolbar: true,
    isBuiltIn: true,
    createdAt: 1,
    updatedAt: 1,
  })
  await storage.createButton({
    id: 'btn-1',
    pageId: 'page-1',
    row: 0,
    column: 0,
    rowSpan: 1,
    columnSpan: 1,
    label: 'want',
    backgroundColor: '#FFF',
    borderColor: '#DDD',
    borderWidth: 1,
    labelColor: '#000',
    labelFontSize: 14,
    labelFontWeight: 'bold',
    symbolScale: 0.65,
    isHidden: false,
    isNavigationButton: false,
    actions: [{ type: 'speak_label' }],
    isBuiltIn: true,
    createdAt: 1,
    updatedAt: 1,
  })
  await storage.createWordList({
    id: 'list-1',
    userId: 'u1',
    name: 'Therapy',
    createdAt: 1,
    updatedAt: 1,
  })
  await storage.addWordToList('list-1', 'btn-1')
  await storage.logTrackingEvent({
    id: 'ev-1',
    userId: 'u1',
    timestamp: 5,
    eventType: 'button_press',
    accessMethod: 'touch',
    isModeling: false,
    sessionId: 's1',
  })
}

describe('createBackup', () => {
  it('captures every store, not just vocabulary', async () => {
    const storage = fakeStorage()
    await populate(storage)
    const backup = await createBackup(storage)

    expect(backup.format).toBe(BACKUP_FORMAT)
    expect(backup.data.users).toHaveLength(1)
    expect(backup.data.pageSets).toHaveLength(1)
    expect(backup.data.pages).toHaveLength(1)
    expect(backup.data.buttons).toHaveLength(1)
    expect(backup.data.wordLists).toHaveLength(1)
    expect(backup.data.wordListItems).toEqual([
      { wordListId: 'list-1', buttonId: 'btn-1' },
    ])
    expect(backup.data.trackingEvents).toHaveLength(1)
  })

  it('keeps the settings the .obz export drops', async () => {
    const storage = fakeStorage()
    await populate(storage)
    const backup = await createBackup(storage)

    // The whole point: access-method tuning and per-profile state survive.
    const restored = backup.data.users[0]
    expect(restored.accessMethod).toBe('scanning')
    expect(restored.scanSpeed).toBe(1200)
    expect(restored.editPinHash).toBe('hash')
    expect(backup.data.meta['prediction:u1']).toContain('juice')
    expect(backup.data.meta['messageHistory:u1']).toContain('I want juice')
  })

  it('includes the full tracking history, not a reporting window', async () => {
    const storage = fakeStorage()
    await populate(storage)
    const backup = await createBackup(storage)
    expect(backup.data.trackingEvents[0].timestamp).toBe(5)
  })
})

describe('parseBackup', () => {
  const valid = () =>
    serializeBackup({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: 1,
      data: {
        meta: {},
        users: [user('u1')],
        pageSets: [],
        pages: [],
        buttons: [],
        wordLists: [],
        wordListItems: [],
        trackingEvents: [],
      },
    })

  it('accepts a file it produced', () => {
    expect(parseBackup(valid()).format).toBe(BACKUP_FORMAT)
  })

  it('rejects non-JSON', () => {
    expect(() => parseBackup('not json')).toThrow(/not a SayThrough backup/)
  })

  it('rejects an unrelated JSON file', () => {
    expect(() => parseBackup('{"hello":"world"}')).toThrow(/not a SayThrough backup/)
  })

  it('rejects a backup from a newer app version', () => {
    const future = JSON.parse(valid())
    future.version = BACKUP_VERSION + 1
    expect(() => parseBackup(JSON.stringify(future))).toThrow(/newer version/)
  })

  it('rejects a damaged backup missing a store', () => {
    const broken = JSON.parse(valid())
    delete broken.data.buttons
    expect(() => parseBackup(JSON.stringify(broken))).toThrow(/damaged \(missing buttons\)/)
  })

  it('rejects a backup with no profiles', () => {
    const empty = JSON.parse(valid())
    empty.data.users = []
    expect(() => parseBackup(JSON.stringify(empty))).toThrow(/no profiles/)
  })
})

describe('restoreBackup', () => {
  it('round-trips a device through export and restore', async () => {
    const source = fakeStorage()
    await populate(source)
    const text = serializeBackup(await createBackup(source))

    const target = fakeStorage()
    await restoreBackup(target, parseBackup(text))

    expect(await target.getUsers()).toEqual(await source.getUsers())
    expect(await target.getPageSets()).toEqual(await source.getPageSets())
    expect(await target.getButtonsForPage('page-1')).toEqual(
      await source.getButtonsForPage('page-1'),
    )
    expect(await target.getWordListButtonIds('list-1')).toEqual(['btn-1'])
    expect(await target.getTrackingEvents('u1', 0)).toHaveLength(1)
    expect(await target.getAllMeta()).toEqual(await source.getAllMeta())
  })

  it('replaces existing data rather than merging into it', async () => {
    const source = fakeStorage()
    await populate(source)
    const backup = await createBackup(source)

    const target = fakeStorage()
    await target.createUser(user('someone-else'))
    await target.setMeta('activeUserId', 'someone-else')
    await restoreBackup(target, backup)

    const users = await target.getUsers()
    expect(users).toHaveLength(1)
    expect(users[0].id).toBe('u1')
    expect(await target.getMeta('activeUserId')).toBe('u1')
  })
})
