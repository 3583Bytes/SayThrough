import { create } from 'zustand'
import { recordSpoken } from '../services/messageHistory'
import { logMessageSpoken } from '../services/TrackingService'
import { ttsService } from '../services/TTSService'
import { useNavigationStore } from './navigationStore'
import { useUserStore } from './userStore'

export interface MessageToken {
  id: string
  text: string
  symbolId?: string // §5.3: tokens show the tapped button's symbol
  customSymbolUri?: string
}

interface MessageState {
  tokens: MessageToken[]
  appendToken: (
    text: string,
    symbol?: Pick<MessageToken, 'symbolId' | 'customSymbolUri'>,
  ) => void
  deleteLastToken: () => void
  removeToken: (id: string) => void
  clearMessage: () => void
  speakMessage: () => void
  // Replace the bar with a saved/recent phrase (text only — re-speakable,
  // symbols aren't restored)
  loadMessage: (text: string) => void
}

let nextTokenId = 0

// §10.3: speak-on-select speaks each word AND still accumulates it —
// immediate feedback without giving up sentence building
export const useMessageStore = create<MessageState>((set, get) => ({
  tokens: [],

  appendToken: (text, symbol) => {
    set((state) => ({
      tokens: [...state.tokens, { id: String(nextTokenId++), text, ...symbol }],
    }))
    if (useUserStore.getState().activeUser?.speakOnSelect) {
      ttsService.speak(text)
    }
  },

  deleteLastToken: () => set((state) => ({ tokens: state.tokens.slice(0, -1) })),

  // Remove one word anywhere in the message (long-press a word in the bar)
  removeToken: (id) =>
    set((state) => ({ tokens: state.tokens.filter((t) => t.id !== id) })),

  clearMessage: () => set({ tokens: [] }),

  loadMessage: (text) =>
    set({
      tokens: text
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => ({ id: String(nextTokenId++), text: w })),
    }),

  speakMessage: () => {
    const message = get()
      .tokens.map((t) => t.text)
      .join(' ')
    if (!message) return
    ttsService.speak(message)
    const user = useUserStore.getState().activeUser
    logMessageSpoken(message) // no-op unless caregiver opted in (tracking)
    void recordSpoken(user?.id, message) // history — always on, per profile
    // §UX post-speak options (both default off): clear the bar and/or jump
    // home so the next utterance starts from core. Text is already captured
    // above, so mutating tokens here is safe.
    if (user?.clearAfterSpeak) set({ tokens: [] })
    if (user?.returnHomeAfterSpeak) useNavigationStore.getState().navigateHome()
  },
}))
