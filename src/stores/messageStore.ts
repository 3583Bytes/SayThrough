import { create } from 'zustand'
import { recordSpoken } from '../services/messageHistory'
import { logMessageSpoken } from '../services/TrackingService'
import { ttsService } from '../services/TTSService'
import { tokenIdAtChar } from '../utils/tokenRanges'
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
  // The token currently being spoken (word-by-word highlight), or null.
  speakingTokenId: string | null
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
  speakingTokenId: null,

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
    const tokens = get().tokens
    const message = tokens.map((t) => t.text).join(' ')
    if (!message) return
    // Word-by-word highlight: map each boundary's charIndex back to a token.
    // Cleared when speech finishes, is interrupted, or errors.
    set({ speakingTokenId: null })
    ttsService.speak(message, {
      onBoundary: (charIndex) => set({ speakingTokenId: tokenIdAtChar(tokens, charIndex) }),
      onDone: () => set({ speakingTokenId: null }),
      onStopped: () => set({ speakingTokenId: null }),
      onError: () => set({ speakingTokenId: null }),
    })
    const user = useUserStore.getState().activeUser
    logMessageSpoken(message) // no-op unless caregiver opted in (tracking)
    void recordSpoken(user?.id, message) // history — always on, per profile
    // §UX post-speak options (both default off): clear the bar and/or jump
    // home so the next utterance starts from core. Text is already captured
    // above, so mutating tokens here is safe.
    if (user?.clearAfterSpeak) set({ tokens: [], speakingTokenId: null })
    if (user?.returnHomeAfterSpeak) useNavigationStore.getState().navigateHome()
  },
}))
