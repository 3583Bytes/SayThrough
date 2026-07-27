import { create } from 'zustand'
import { storage } from '../storage'
import type { Button } from '../types/models'

// §13.2 — every edit is recorded as a reversible operation. Whole-button
// snapshots keep inversion trivial. Stacks are capped at 25 and cleared
// when exiting edit mode (per spec). Page-level operations are covered
// by the "restore built-in page sets" safety net instead.
export type EditAction =
  | { type: 'ADD_BUTTON'; button: Button }
  | { type: 'DELETE_BUTTON'; button: Button }
  | { type: 'UPDATE_BUTTON'; before: Button; after: Button }
  | {
      type: 'MOVE_BUTTON'
      moved: Button // snapshot BEFORE the move
      to: { row: number; column: number }
      swapped?: Button // snapshot BEFORE the move (was at `to`)
    }

const MAX_UNDO = 25

async function applyInverse(action: EditAction): Promise<void> {
  switch (action.type) {
    case 'ADD_BUTTON':
      await storage.deleteButton(action.button.id)
      break
    case 'DELETE_BUTTON':
      await storage.createButton(action.button)
      break
    case 'UPDATE_BUTTON':
      await storage.updateButton(action.before)
      break
    case 'MOVE_BUTTON':
      await storage.updateButton(action.moved)
      if (action.swapped) await storage.updateButton(action.swapped)
      break
  }
}

async function applyForward(action: EditAction): Promise<void> {
  switch (action.type) {
    case 'ADD_BUTTON':
      await storage.createButton(action.button)
      break
    case 'DELETE_BUTTON':
      await storage.deleteButton(action.button.id)
      break
    case 'UPDATE_BUTTON':
      await storage.updateButton(action.after)
      break
    case 'MOVE_BUTTON': {
      await storage.updateButton({
        ...action.moved,
        row: action.to.row,
        column: action.to.column,
      })
      if (action.swapped) {
        await storage.updateButton({
          ...action.swapped,
          row: action.moved.row,
          column: action.moved.column,
        })
      }
      break
    }
  }
}

interface EditState {
  isEditMode: boolean
  selectedButtonId: string | null
  isEditorOpen: boolean
  wordListEditingId: string | null // §12.2: tapping buttons toggles membership
  undoStack: EditAction[]
  redoStack: EditAction[]
  enterEditMode: () => void
  exitEditMode: () => void
  selectButton: (buttonId: string | null) => void
  openEditor: () => void
  closeEditor: () => void
  setWordListEditing: (wordListId: string | null) => void
  pushEdit: (action: EditAction) => void
  undo: () => Promise<void>
  redo: () => Promise<void>
}

export const useEditStore = create<EditState>((set, get) => ({
  isEditMode: false,
  selectedButtonId: null,
  isEditorOpen: false,
  wordListEditingId: null,
  undoStack: [],
  redoStack: [],

  enterEditMode: () => set({ isEditMode: true }),
  exitEditMode: () =>
    set({
      isEditMode: false,
      selectedButtonId: null,
      isEditorOpen: false,
      wordListEditingId: null,
      undoStack: [], // §13.2: stack cleared when exiting edit mode
      redoStack: [],
    }),
  selectButton: (buttonId) => set({ selectedButtonId: buttonId }),
  openEditor: () => set({ isEditorOpen: true }),
  closeEditor: () => set({ isEditorOpen: false }),
  setWordListEditing: (wordListId) => set({ wordListEditingId: wordListId }),

  pushEdit: (action) =>
    set((state) => ({
      undoStack: [...state.undoStack.slice(-(MAX_UNDO - 1)), action],
      redoStack: [],
    })),

  undo: async () => {
    const { undoStack, redoStack } = get()
    const action = undoStack[undoStack.length - 1]
    if (!action) return
    await applyInverse(action)
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, action],
      selectedButtonId: null,
      isEditorOpen: false,
    })
  },

  redo: async () => {
    const { undoStack, redoStack } = get()
    const action = redoStack[redoStack.length - 1]
    if (!action) return
    await applyForward(action)
    set({
      undoStack: [...undoStack, action],
      redoStack: redoStack.slice(0, -1),
      selectedButtonId: null,
      isEditorOpen: false,
    })
  },
}))
