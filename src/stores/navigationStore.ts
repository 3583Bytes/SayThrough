import { create } from 'zustand'

// §7.1 — vocabulary page navigation lives here, NOT in React Navigation
// (§11.2): every page renders in the same CommunicationScreen.
interface NavigationState {
  activePageSetId: string | null
  rootPageId: string | null
  currentPageId: string | null
  pageHistory: string[]
  setActivePageSet: (pageSetId: string, rootPageId: string) => void
  navigateTo: (pageId: string) => void
  navigateBack: () => void
  navigateHome: () => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activePageSetId: null,
  rootPageId: null,
  currentPageId: null,
  pageHistory: [],

  setActivePageSet: (pageSetId, rootPageId) =>
    set({
      activePageSetId: pageSetId,
      rootPageId,
      currentPageId: rootPageId,
      pageHistory: [],
    }),

  navigateTo: (pageId) =>
    set((state) => ({
      currentPageId: pageId,
      pageHistory: state.currentPageId
        ? [...state.pageHistory, state.currentPageId]
        : state.pageHistory,
    })),

  navigateBack: () =>
    set((state) => {
      const history = [...state.pageHistory]
      const previous = history.pop()
      return previous ? { currentPageId: previous, pageHistory: history } : state
    }),

  navigateHome: () =>
    set((state) =>
      state.rootPageId
        ? { currentPageId: state.rootPageId, pageHistory: [] }
        : state,
    ),
}))
