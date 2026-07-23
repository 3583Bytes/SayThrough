import { createStorage } from './createStorage'
import type { Storage } from './types'

// Singleton — Metro picks createStorage.web.ts (IndexedDB) for web and
// createStorage.ts (expo-sqlite) for iOS/Android.
export const storage: Storage = createStorage()
export type { Storage } from './types'
