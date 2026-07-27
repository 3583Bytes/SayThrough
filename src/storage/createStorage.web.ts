import type {
  Button,
  Page,
  PageSet,
  TrackingEvent,
  UserProfile,
  WordList,
} from '../types/models'
import type { Storage } from './types'

// Web driver: plain IndexedDB. Object stores mirror the SQLite tables
// (§8.1); records are stored as whole model objects since IndexedDB is
// document-shaped — the repository interface keeps callers agnostic.

const DB_NAME = 'saythrough'
const DB_VERSION = 4 // v2: users; v3: word lists; v4: tracking events

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

class WebStorage implements Storage {
  private db!: IDBDatabase

  async init(): Promise<void> {
    // Reduce the risk of the browser evicting the vocabulary (§8)
    try {
      await navigator.storage?.persist?.()
    } catch {
      // best effort only
    }

    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, DB_VERSION)
      open.onupgradeneeded = () => {
        const db = open.result
        const has = (name: string) => db.objectStoreNames.contains(name)
        if (!has('meta')) db.createObjectStore('meta')
        if (!has('pageSets')) db.createObjectStore('pageSets', { keyPath: 'id' })
        if (!has('pages')) {
          const pages = db.createObjectStore('pages', { keyPath: 'id' })
          pages.createIndex('pageSetId', 'pageSetId')
        }
        if (!has('buttons')) {
          const buttons = db.createObjectStore('buttons', { keyPath: 'id' })
          buttons.createIndex('pageId', 'pageId')
        }
        if (!has('users')) db.createObjectStore('users', { keyPath: 'id' })
        if (!has('wordLists')) db.createObjectStore('wordLists', { keyPath: 'id' })
        if (!has('wordListItems')) {
          // key = `${wordListId}:${buttonId}`
          const items = db.createObjectStore('wordListItems', { keyPath: 'id' })
          items.createIndex('wordListId', 'wordListId')
        }
        if (!has('trackingEvents')) {
          const events = db.createObjectStore('trackingEvents', { keyPath: 'id' })
          events.createIndex('userId', 'userId')
        }
      }
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => reject(open.error)
    })
  }

  private store(name: string, mode: IDBTransactionMode = 'readonly') {
    return this.db.transaction(name, mode).objectStore(name)
  }

  async clearAll(): Promise<void> {
    const names = [
      'meta',
      'pageSets',
      'pages',
      'buttons',
      'users',
      'wordLists',
      'wordListItems',
      'trackingEvents',
    ]
    for (const name of names) {
      await promisify(this.store(name, 'readwrite').clear())
    }
  }

  async logTrackingEvent(event: TrackingEvent): Promise<void> {
    await promisify(this.store('trackingEvents', 'readwrite').put(event))
  }

  async getTrackingEvents(userId: string, sinceTs: number): Promise<TrackingEvent[]> {
    const all = (await promisify(
      this.store('trackingEvents').index('userId').getAll(userId),
    )) as TrackingEvent[]
    return all.filter((event) => event.timestamp >= sinceTs)
  }

  async searchButtons(pageSetId: string, query: string) {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    const pages = await this.getPagesForPageSet(pageSetId)
    const results: Array<{ button: Button; pageName: string }> = []
    for (const page of pages) {
      const buttons = await this.getButtonsForPage(page.id)
      for (const button of buttons) {
        if (button.label.toLowerCase().includes(needle)) {
          results.push({ button, pageName: page.name })
        }
      }
    }
    return results
  }

  async getWordLists(userId: string): Promise<WordList[]> {
    const all = (await promisify(this.store('wordLists').getAll())) as WordList[]
    return all.filter((list) => list.userId === userId)
  }

  async createWordList(list: WordList): Promise<void> {
    await promisify(this.store('wordLists', 'readwrite').put(list))
  }

  async deleteWordList(id: string): Promise<void> {
    await promisify(this.store('wordLists', 'readwrite').delete(id))
    const items = this.db
      .transaction('wordListItems', 'readwrite')
      .objectStore('wordListItems')
    const keys = await promisify(items.index('wordListId').getAllKeys(id))
    for (const key of keys) await promisify(items.delete(key))
  }

  async getWordListButtonIds(wordListId: string): Promise<string[]> {
    const items = (await promisify(
      this.store('wordListItems').index('wordListId').getAll(wordListId),
    )) as Array<{ buttonId: string }>
    return items.map((item) => item.buttonId)
  }

  async addWordToList(wordListId: string, buttonId: string): Promise<void> {
    await promisify(
      this.store('wordListItems', 'readwrite').put({
        id: `${wordListId}:${buttonId}`,
        wordListId,
        buttonId,
      }),
    )
  }

  async removeWordFromList(wordListId: string, buttonId: string): Promise<void> {
    await promisify(
      this.store('wordListItems', 'readwrite').delete(`${wordListId}:${buttonId}`),
    )
  }

  async getUsers(): Promise<UserProfile[]> {
    return promisify(this.store('users').getAll()) as Promise<UserProfile[]>
  }

  async createUser(user: UserProfile): Promise<void> {
    await promisify(this.store('users', 'readwrite').put(user))
  }

  async updateUser(user: UserProfile): Promise<void> {
    await promisify(this.store('users', 'readwrite').put(user))
  }

  async getMeta(key: string): Promise<string | null> {
    const value = await promisify(this.store('meta').get(key))
    return value === undefined ? null : (value as string)
  }

  async setMeta(key: string, value: string): Promise<void> {
    await promisify(this.store('meta', 'readwrite').put(value, key))
  }

  async getPageSets(): Promise<PageSet[]> {
    return promisify(this.store('pageSets').getAll()) as Promise<PageSet[]>
  }

  async getPageSet(id: string): Promise<PageSet | null> {
    const row = await promisify(this.store('pageSets').get(id))
    return (row as PageSet) ?? null
  }

  async createPageSet(pageSet: PageSet): Promise<void> {
    await promisify(this.store('pageSets', 'readwrite').put(pageSet))
  }

  async deletePageSet(id: string): Promise<void> {
    // callers delete the set's pages first (deletePage cascades buttons)
    await promisify(this.store('pageSets', 'readwrite').delete(id))
  }

  async getPage(id: string): Promise<Page | null> {
    const row = await promisify(this.store('pages').get(id))
    return (row as Page) ?? null
  }

  async getPagesForPageSet(pageSetId: string): Promise<Page[]> {
    return promisify(
      this.store('pages').index('pageSetId').getAll(pageSetId),
    ) as Promise<Page[]>
  }

  async createPage(page: Page): Promise<void> {
    await promisify(this.store('pages', 'readwrite').put(page))
  }

  async updatePage(page: Page): Promise<void> {
    await promisify(this.store('pages', 'readwrite').put(page))
  }

  async deletePage(id: string): Promise<void> {
    await promisify(this.store('pages', 'readwrite').delete(id))
    const buttons = this.db
      .transaction('buttons', 'readwrite')
      .objectStore('buttons')
    const keys = await promisify(buttons.index('pageId').getAllKeys(id))
    for (const key of keys) await promisify(buttons.delete(key))
  }

  async getButtonsForPage(pageId: string): Promise<Button[]> {
    return promisify(
      this.store('buttons').index('pageId').getAll(pageId),
    ) as Promise<Button[]>
  }

  async createButton(button: Button): Promise<void> {
    await promisify(this.store('buttons', 'readwrite').put(button))
  }

  async updateButton(button: Button): Promise<void> {
    await promisify(this.store('buttons', 'readwrite').put(button))
  }

  async deleteButton(id: string): Promise<void> {
    await promisify(this.store('buttons', 'readwrite').delete(id))
  }
}

export function createStorage(): Storage {
  return new WebStorage()
}
