import { create } from 'zustand'
import { ttsService } from '../services/TTSService'

export interface MessageToken {
  id: string
  text: string
}

interface MessageState {
  tokens: MessageToken[]
  speakOnSelect: boolean
  appendToken: (text: string) => void
  deleteLastToken: () => void
  clearMessage: () => void
  speakMessage: () => void
}

let nextTokenId = 0

// §10.3: speak-on-select speaks each word AND still accumulates it —
// immediate feedback without giving up sentence building
export const useMessageStore = create<MessageState>((set, get) => ({
  tokens: [],
  speakOnSelect: false,

  appendToken: (text) => {
    set((state) => ({
      tokens: [...state.tokens, { id: String(nextTokenId++), text }],
    }))
    if (get().speakOnSelect) {
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
    }
  },
}))
