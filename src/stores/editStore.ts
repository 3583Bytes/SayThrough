import { create } from 'zustand'

// §7.4 — undo/redo stacks arrive with the move/bulk-edit work
interface EditState {
  isEditMode: boolean
  selectedButtonId: string | null
  isEditorOpen: boolean
  wordListEditingId: string | null // §12.2: tapping buttons toggles membership
  enterEditMode: () => void
  exitEditMode: () => void
  selectButton: (buttonId: string | null) => void
  openEditor: () => void
  closeEditor: () => void
  setWordListEditing: (wordListId: string | null) => void
}

export const useEditStore = create<EditState>((set) => ({
  isEditMode: false,
  selectedButtonId: null,
  isEditorOpen: false,
  wordListEditingId: null,

  enterEditMode: () => set({ isEditMode: true }),
  exitEditMode: () =>
    set({
      isEditMode: false,
      selectedButtonId: null,
      isEditorOpen: false,
      wordListEditingId: null,
    }),
  selectButton: (buttonId) => set({ selectedButtonId: buttonId }),
  openEditor: () => set({ isEditorOpen: true }),
  closeEditor: () => set({ isEditorOpen: false }),
  setWordListEditing: (wordListId) => set({ wordListEditingId: wordListId }),
}))
