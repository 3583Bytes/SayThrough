import type {
  Button,
  Page,
  PageSet,
  TrackingEvent,
  UserProfile,
  WordList,
} from '../types/models'

// Repository interface — technical-specification.md §8. The schema and
// models are identical across platforms; only the driver differs:
// createStorage.ts (native, expo-sqlite) vs createStorage.web.ts
// (IndexedDB — expo-sqlite's web build is alpha and needs COOP/COEP
// headers that static hosts like GitHub Pages cannot set).
export interface Storage {
  init(): Promise<void>

  // Wipe everything — dev reseeds and the future "reset app" setting
  clearAll(): Promise<void>

  // meta key-value (extraction flags, active ids, …)
  getMeta(key: string): Promise<string | null>
  setMeta(key: string, value: string): Promise<void>
  // Every meta row. Needed by the full backup (§14.3): meta holds the
  // active profile, seed version, per-profile message history and the
  // learned prediction model, none of which are reachable by key alone.
  getAllMeta(): Promise<Record<string, string>>

  getUsers(): Promise<UserProfile[]>
  createUser(user: UserProfile): Promise<void>
  updateUser(user: UserProfile): Promise<void>

  getPageSets(): Promise<PageSet[]>
  getPageSet(id: string): Promise<PageSet | null>
  createPageSet(pageSet: PageSet): Promise<void>
  deletePageSet(id: string): Promise<void>

  getPage(id: string): Promise<Page | null>
  getPagesForPageSet(pageSetId: string): Promise<Page[]>
  createPage(page: Page): Promise<void>
  updatePage(page: Page): Promise<void>
  deletePage(id: string): Promise<void> // cascades to its buttons

  getButtonsForPage(pageId: string): Promise<Button[]>
  createButton(button: Button): Promise<void>
  updateButton(button: Button): Promise<void>
  deleteButton(id: string): Promise<void>

  // §12.4 vocabulary search — substring match over labels in a page set
  searchButtons(
    pageSetId: string,
    query: string,
  ): Promise<Array<{ button: Button; pageName: string }>>

  // §4.8 vocabulary filter word lists
  getWordLists(userId: string): Promise<WordList[]>
  createWordList(list: WordList): Promise<void>
  deleteWordList(id: string): Promise<void>
  getWordListButtonIds(wordListId: string): Promise<string[]>
  addWordToList(wordListId: string, buttonId: string): Promise<void>
  removeWordFromList(wordListId: string, buttonId: string): Promise<void>

  // §4.13 data tracking (caregiver opt-in)
  logTrackingEvent(event: TrackingEvent): Promise<void>
  getTrackingEvents(userId: string, sinceTs: number): Promise<TrackingEvent[]>
}
