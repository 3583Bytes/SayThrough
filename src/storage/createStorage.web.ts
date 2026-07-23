import type { Button, Page, PageSet, UserProfile } from '../types/models'
import type { Storage } from './types'

// Web driver: plain IndexedDB. Object stores mirror the SQLite tables
// (§8.1); records are stored as whole model objects since IndexedDB is
// document-shaped — the repository interface keeps callers agnostic.

const DB_NAME = 'saythrough'
const DB_VERSION = 2 // v2: users store

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
      }
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => reject(open.error)
    })
  }

  private store(name: string, mode: IDBTransactionMode = 'readonly') {
    return this.db.transaction(name, mode).objectStore(name)
  }

  async clearAll(): Promise<void> {
    for (const name of ['meta', 'pageSets', 'pages', 'buttons', 'users']) {
      await promisify(this.store(name, 'readwrite').clear())
    }
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
