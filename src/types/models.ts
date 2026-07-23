// Data models — technical-specification.md §4. Fields not yet used by the
// app (styling overrides, audio, spans) are included so rows written now
// stay forward-compatible.

export interface PageSet {
  id: string
  name: string
  description?: string
  language: string // BCP-47
  rootPageId: string
  schemaVersion: number
  isBuiltIn: boolean
  createdAt: number
  updatedAt: number
}

export interface Page {
  id: string
  pageSetId: string
  name: string
  symbolId?: string // namespaced ref, e.g. 'arasaac:2788'
  rows: number
  columns: number
  backgroundColor: string
  showMessageBar: boolean
  showToolbar: boolean
  isBuiltIn: boolean
  createdAt: number
  updatedAt: number
}

export interface Button {
  id: string
  pageId: string
  row: number
  column: number
  rowSpan: number
  columnSpan: number

  label: string
  symbolId?: string // namespaced ref, e.g. 'arasaac:2788'
  customSymbolUri?: string
  audioUri?: string
  audioCueUri?: string

  backgroundColor: string
  borderColor: string
  borderWidth: number
  labelColor: string
  labelFontSize: number
  labelFontWeight: 'normal' | 'bold'
  symbolScale: number

  isHidden: boolean
  isNavigationButton: boolean
  actions: ButtonAction[]

  isBuiltIn: boolean
  createdAt: number
  updatedAt: number
}

// §4.5 — the subset implemented so far; the full set arrives with the
// features that consume it
export type ButtonAction =
  | { type: 'speak_label' }
  | { type: 'speak_message' }
  | { type: 'append_to_message'; text?: string }
  | { type: 'navigate'; pageId: string }
  | { type: 'navigate_back' }
  | { type: 'navigate_home' }
  | { type: 'clear_message' }
  | { type: 'delete_last_word' }
