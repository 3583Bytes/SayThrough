import type { Storage } from '../storage/types'
import type {
  Button,
  Page,
  PageSet,
  TrackingEvent,
  UserProfile,
  WordList,
} from '../types/models'
import { invalidateModelCache } from './predictionModel'

// Full-device backup (§14.3). The .obz export next to this one carries
// vocabulary and nothing else — not the profile, TTS voice, access-method
// tuning, PIN, word lists, history or tracking. That gap is the whole reason
// this exists: losing browser storage, replacing a device or having a school
// reimage a tablet currently loses everything a family and SLP configured,
// including the scan speed and dwell timing someone tuned in a therapy
// session.
//
// Deliberately a plain JSON file rather than cloud sync: it keeps the
// local-first, no-account promise intact while removing the "one wipe and
// it's gone" failure. Optional sync (Tier 4) can come later and reuse this
// shape.

export const BACKUP_FORMAT = 'saythrough-backup'
export const BACKUP_VERSION = 1

export interface BackupData {
  meta: Record<string, string>
  users: UserProfile[]
  pageSets: PageSet[]
  pages: Page[]
  buttons: Button[]
  wordLists: WordList[]
  wordListItems: Array<{ wordListId: string; buttonId: string }>
  trackingEvents: TrackingEvent[]
}

export interface BackupFile {
  format: string
  version: number
  exportedAt: number
  data: BackupData
}

/** Read every store into one snapshot. */
export async function createBackup(storage: Storage): Promise<BackupFile> {
  const [meta, users, pageSets] = await Promise.all([
    storage.getAllMeta(),
    storage.getUsers(),
    storage.getPageSets(),
  ])

  const pages: Page[] = []
  for (const pageSet of pageSets) {
    pages.push(...(await storage.getPagesForPageSet(pageSet.id)))
  }

  const buttons: Button[] = []
  for (const page of pages) {
    buttons.push(...(await storage.getButtonsForPage(page.id)))
  }

  const wordLists: WordList[] = []
  const wordListItems: BackupData['wordListItems'] = []
  const trackingEvents: TrackingEvent[] = []
  for (const user of users) {
    for (const list of await storage.getWordLists(user.id)) {
      wordLists.push(list)
      for (const buttonId of await storage.getWordListButtonIds(list.id)) {
        wordListItems.push({ wordListId: list.id, buttonId })
      }
    }
    // sinceTs 0 — a backup is the whole history, not a reporting window.
    trackingEvents.push(...(await storage.getTrackingEvents(user.id, 0)))
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    data: {
      meta,
      users,
      pageSets,
      pages,
      buttons,
      wordLists,
      wordListItems,
      trackingEvents,
    },
  }
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2)
}

/**
 * Validate an untrusted file before it is allowed anywhere near storage —
 * restore wipes the device first, so a half-valid file must fail here rather
 * than part-way through. Throws with a message fit to show the user.
 */
export function parseBackup(text: string): BackupFile {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('That file is not a SayThrough backup.')
  }

  const file = parsed as Partial<BackupFile>
  if (!file || typeof file !== 'object' || file.format !== BACKUP_FORMAT) {
    throw new Error('That file is not a SayThrough backup.')
  }
  if (typeof file.version !== 'number' || file.version > BACKUP_VERSION) {
    throw new Error(
      'That backup was made by a newer version of SayThrough. Update the app first.',
    )
  }

  const data = file.data as Partial<BackupData> | undefined
  if (!data || typeof data !== 'object') {
    throw new Error('That backup is missing its contents.')
  }

  const lists: Array<keyof BackupData> = [
    'users',
    'pageSets',
    'pages',
    'buttons',
    'wordLists',
    'wordListItems',
    'trackingEvents',
  ]
  for (const key of lists) {
    if (!Array.isArray(data[key])) {
      throw new Error(`That backup is damaged (missing ${key}).`)
    }
  }
  if (!data.meta || typeof data.meta !== 'object' || Array.isArray(data.meta)) {
    throw new Error('That backup is damaged (missing meta).')
  }
  if (!data.users!.length) {
    throw new Error('That backup contains no profiles.')
  }

  return file as BackupFile
}

/**
 * Replace everything on the device with the backup. Destructive by design —
 * a merge would have to invent answers for conflicting ids, and "restore"
 * should mean what it says. Callers must confirm first.
 */
export async function restoreBackup(
  storage: Storage,
  backup: BackupFile,
): Promise<void> {
  const { data } = backup
  await storage.clearAll()

  // Ordered by reference: page sets before pages before buttons, word lists
  // before their items, so the SQLite driver's foreign keys hold at every
  // step.
  for (const [key, value] of Object.entries(data.meta)) {
    await storage.setMeta(key, value)
  }
  for (const user of data.users) await storage.createUser(user)
  for (const pageSet of data.pageSets) await storage.createPageSet(pageSet)
  for (const page of data.pages) await storage.createPage(page)
  for (const button of data.buttons) await storage.createButton(button)
  for (const list of data.wordLists) await storage.createWordList(list)
  for (const item of data.wordListItems) {
    await storage.addWordToList(item.wordListId, item.buttonId)
  }
  for (const event of data.trackingEvents) await storage.logTrackingEvent(event)

  // The learned prediction model is memoized per profile id. Restoring can
  // put different data behind the same id, so the cache has to be dropped or
  // the user keeps typing against the pre-restore model.
  invalidateModelCache()
}
