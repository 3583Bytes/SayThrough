import { create } from 'zustand'
import { warmLexicon } from '../services/prediction'
import { loadModel } from '../services/predictionModel'
import { ttsService } from '../services/TTSService'
import { storage } from '../storage'
import type { UserProfile } from '../types/models'
import { uuid } from '../utils/uuid'

// §7.3 — active profile drives TTS settings, speak-on-select, PIN gate
export const GUEST_USER_ID = 'guest'

interface UserState {
  activeUser: UserProfile | null
  users: UserProfile[]
  load: () => Promise<void>
  setActiveUser: (userId: string) => Promise<void>
  updateActiveUser: (changes: Partial<UserProfile>) => Promise<void>
  createUser: (name: string, activePageSetId: string) => Promise<UserProfile>
  startGuest: (activePageSetId: string) => void // §4.14: nothing saved
  endGuest: () => void
}

function applyTtsSettings(user: UserProfile) {
  // The router falls back per-utterance if the enhanced voice is not ready,
  // so preferring it before the model has loaded is safe.
  ttsService.setPreferredBackend(user.ttsEngine ?? 'platform')
  ttsService.configure({
    voiceId: user.ttsVoiceId,
    language: user.language,
    rate: user.ttsRate,
    pitch: user.ttsPitch,
    volume: user.ttsVolume,
  })
}

// Everything that must follow the active profile. Prediction is per-profile
// (§18.2), so switching users without this would leave one user typing
// against another's learned words.
function activateProfile(user: UserProfile) {
  applyTtsSettings(user)
  warmLexicon(user.language)
  void loadModel(user.id)
}

export const useUserStore = create<UserState>((set, get) => ({
  activeUser: null,
  users: [],

  load: async () => {
    const users = await storage.getUsers()
    const activeId = await storage.getMeta('activeUserId')
    const activeUser = users.find((u) => u.id === activeId) ?? users[0] ?? null
    if (activeUser) activateProfile(activeUser)
    set({ users, activeUser })
  },

  setActiveUser: async (userId) => {
    const user = get().users.find((u) => u.id === userId)
    if (!user) return
    await storage.setMeta('activeUserId', userId)
    activateProfile(user)
    set({ activeUser: user })
  },

  updateActiveUser: async (changes) => {
    const current = get().activeUser
    if (!current) return
    const updated = { ...current, ...changes, updatedAt: Date.now() }
    if (current.id !== GUEST_USER_ID) {
      await storage.updateUser(updated) // guest sessions persist nothing
    }
    applyTtsSettings(updated)
    set({
      activeUser: updated,
      users: get().users.map((u) => (u.id === updated.id ? updated : u)),
    })
  },

  createUser: async (name, activePageSetId) => {
    const now = Date.now()
    const user: UserProfile = {
      id: uuid(),
      name,
      activePageSetId,
      language: 'en-US',
      ttsRate: 0.9,
      ttsPitch: 1.0,
      ttsVolume: 1.0,
      speakOnSelect: false,
      createdAt: now,
      updatedAt: now,
    }
    await storage.createUser(user)
    await storage.setMeta('activeUserId', user.id)
    activateProfile(user)
    set({ users: [...get().users, user], activeUser: user })
    return user
  },

  // "Try SayThrough" — a transient in-memory profile so an SLP or parent
  // can evaluate from a link in 30 seconds; never written to storage
  startGuest: (activePageSetId) => {
    const now = Date.now()
    const guest: UserProfile = {
      id: GUEST_USER_ID,
      name: 'Guest',
      activePageSetId,
      language: 'en-US',
      ttsRate: 0.9,
      ttsPitch: 1.0,
      ttsVolume: 1.0,
      speakOnSelect: false,
      createdAt: now,
      updatedAt: now,
    }
    activateProfile(guest)
    set({ activeUser: guest })
  },

  endGuest: () => {
    if (get().activeUser?.id === GUEST_USER_ID) set({ activeUser: null })
  },
}))
