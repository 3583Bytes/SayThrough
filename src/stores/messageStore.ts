import { create } from 'zustand'
import { logMessageSpoken } from '../services/TrackingService'
import { ttsService } from '../services/TTSService'
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
  clearMessage: () => void
  speakMessage: () => void
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

  clearMessage: () => set({ tokens: [] }),

  speakMessage: () => {
    const message = get()
      .tokens.map((t) => t.text)
      .join(' ')
    if (message) {
      ttsService.speak(message)
      logMessageSpoken(message) // no-op unless caregiver opted in
    }
  },
}))
