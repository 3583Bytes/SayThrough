import { create } from 'zustand'

// §7.4 — undo/redo stacks arrive with the move/bulk-edit work
interface EditState {
  isEditMode: boolean
  selectedButtonId: string | null
  isEditorOpen: boolean
  enterEditMode: () => void
  exitEditMode: () => void
  selectButton: (buttonId: string | null) => void
  openEditor: () => void
  closeEditor: () => void
}

export const useEditStore = create<EditState>((set) => ({
  isEditMode: false,
  selectedButtonId: null,
  isEditorOpen: false,

  enterEditMode: () => set({ isEditMode: true }),
  exitEditMode: () =>
    set({ isEditMode: false, selectedButtonId: null, isEditorOpen: false }),
  selectButton: (buttonId) => set({ selectedButtonId: buttonId }),
  openEditor: () => set({ isEditorOpen: true }),
  closeEditor: () => set({ isEditorOpen: false }),
}))
