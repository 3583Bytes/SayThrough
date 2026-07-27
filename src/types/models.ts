// Data models — technical-specification.md §4. Fields not yet used by the
// app (styling overrides, audio, spans) are included so rows written now
// stay forward-compatible.

// §4.1 — the fields implemented so far; access-method, layout-preference,
// and tracking fields arrive with their features
export type AccessMethod = 'touch' | 'dwell' | 'scanning'

export interface UserProfile {
  id: string
  name: string
  activePageSetId: string
  language: string // BCP-47
  ttsVoiceId?: string // platform voice identifier
  ttsRate: number // 0.1–2.0 (default 0.9)
  ttsPitch: number // 0.5–2.0 (default 1.0)
  ttsVolume: number // 0.0–1.0 (default 1.0)
  speakOnSelect: boolean
  // Access method (§4.6) — how the user physically selects. Defaults to
  // touch; 'dwell' and 'scanning' widen who can use the app.
  accessMethod?: AccessMethod
  dwellTime?: number // ms to hover before selecting (AM-04, default 1000)
  scanSpeed?: number // ms between auto-scan advances (AM-05, default 1500)
  scanPattern?: 'row-column' | 'linear'
  scanMode?: 'auto' | 'step' // auto = 1-switch timed; step = 2-switch
  scanAuditory?: boolean // speak each item as it is highlighted
  // Touch accommodations (AM-01) — optional so profiles created before
  // these fields existed read as "off"
  touchHoldDuration?: number // ms a button must be held before activating
  touchDebounce?: number // ms after an activation ignoring further taps
  ignoreSecondTouch?: boolean // palm / second-hand guard
  editPinHash?: string // SHA-256(salt:pin) via expo-crypto (§13.1)
  editPinSalt?: string
  // Vocabulary filter (§4.8)
  activeWordListId?: string
  filterEnabled?: boolean
  // Data tracking (§4.13) — default OFF: caregiver must opt in
  // (COPPA/GDPR consent; requirements DT-05)
  trackingEnabled?: boolean
  // Layout preferences (§6.1 requirements)
  messageBarPosition?: 'top' | 'bottom' // bottom = easier reach when mounted
  buttonGap?: 'compact' | 'normal' | 'wide' // wide reduces mis-hits
  labelTextScale?: number // 0.85–1.4 button-label multiplier
  createdAt: number
  updatedAt: number
}

// §4.7 — one row per communication event
export interface TrackingEvent {
  id: string
  userId: string
  timestamp: number
  eventType: 'button_press' | 'message_spoken' | 'session_start'
  buttonId?: string
  buttonLabel?: string // snapshot at time of press
  pageId?: string
  accessMethod: string // DT-01: how the selection was made
  isModeling: boolean // modeling mode arrives with the SLP tooling
  sessionId: string
}

// §4.6 — a word list maps to specific BUTTONS, not labels, so the same
// word on different pages can be included independently
export interface WordList {
  id: string
  userId: string
  name: string
  createdAt: number
  updatedAt: number
}

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
