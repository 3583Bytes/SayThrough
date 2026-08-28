import { create } from 'zustand'
import { coreSetIdForLanguage } from '../data/seedCoreVocabulary'
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, langCode } from '../i18n'
import { warmLexicon } from '../services/prediction'
import { loadModel } from '../services/predictionModel'
import { ttsService } from '../services/TTSService'
import { storage } from '../storage'
import type { UserProfile } from '../types/models'
import { uuid } from '../utils/uuid'
import { useNavigationStore } from './navigationStore'

// §7.3 — active profile drives TTS settings, speak-on-select, PIN gate
export const GUEST_USER_ID = 'guest'

interface UserState {
  activeUser: UserProfile | null
  users: UserProfile[]
  load: () => Promise<void>
  setActiveUser: (userId: string) => Promise<void>
  updateActiveUser: (changes: Partial<UserProfile>) => Promise<void>
  createUser: (
    name: string,
    activePageSetId: string,
    language?: string,
  ) => Promise<UserProfile>
  startGuest: (activePageSetId: string, language?: string) => void // §4.14: nothing saved
  // §19.7 — switching language also moves the profile onto that language's
  // board, because a page set is authored in one language and cannot be
  // reflowed into another (§19.2). Pages, word lists and history are kept.
  setLanguage: (language: string) => Promise<void>
  endGuest: () => void
}

/** BCP-47 tag for a language code, e.g. 'es' → 'es-ES'. */
function defaultTag(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.bcp47 ?? 'en-US'
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

  // §19.7. Language is not just a label: the vocabulary, the voice, the
  // prediction lexicon and the word-form engine all follow it. Switching also
  // moves the profile to the same SIZE of board in the new language, so a
  // 6×10 user does not silently land on a 5×6 one.
  setLanguage: async (language) => {
    const current = get().activeUser
    if (!current) return
    const nextCode = langCode(language)
    if (langCode(current.language) === nextCode) return

    const { languageOfPageSet, sameSizeInLanguage } = await import(
      '../data/seedCoreVocabulary'
    )
    // Only move the board if the profile is on a built-in one; a user who
    // built their own page set keeps it, whatever language they label it.
    const onBuiltIn = languageOfPageSet(current.activePageSetId) !== null
    const activePageSetId = onBuiltIn
      ? (sameSizeInLanguage(current.activePageSetId, nextCode) ??
        coreSetIdForLanguage(language))
      : current.activePageSetId

    const updated = {
      ...current,
      language,
      activePageSetId,
      // A voice chosen for the old language will not speak the new one, and
      // the enhanced model is per-language and not yet downloaded — so both
      // reset to the platform default rather than silently falling back on
      // every utterance.
      ttsVoiceId: undefined,
      ttsEngine: 'platform' as const,
      updatedAt: Date.now(),
    }
    if (current.id !== GUEST_USER_ID) await storage.updateUser(updated)
    activateProfile(updated)
    set({
      activeUser: updated,
      users: get().users.map((u) => (u.id === updated.id ? updated : u)),
    })

    // The profile now points at the new language's board, but navigation
    // holds the page it was on — so without this the chrome switches
    // language while the grid keeps showing the old board's words.
    if (activePageSetId !== current.activePageSetId) {
      const pageSet = await storage.getPageSet(activePageSetId)
      if (pageSet) {
        useNavigationStore
          .getState()
          .setActivePageSet(pageSet.id, pageSet.rootPageId)
      }
    }
  },

  createUser: async (name, activePageSetId, language) => {
    const now = Date.now()
    const user: UserProfile = {
      id: uuid(),
      name,
      activePageSetId,
      language: language ?? defaultTag(DEFAULT_LANGUAGE),
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
  startGuest: (activePageSetId, language) => {
    const now = Date.now()
    const guest: UserProfile = {
      id: GUEST_USER_ID,
      name: 'Guest',
      activePageSetId,
      language: language ?? defaultTag(DEFAULT_LANGUAGE),
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
