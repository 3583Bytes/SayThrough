# SayThrough — Technical Specification
Version 1.0 — April 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Data Models](#4-data-models)
5. [Screen Specifications](#5-screen-specifications)
6. [Component Specifications](#6-component-specifications)
7. [State Management](#7-state-management)
8. [Storage & Persistence](#8-storage--persistence)
9. [Symbol Asset System](#9-symbol-asset-system)
10. [Text-to-Speech Specification](#10-text-to-speech-specification)
11. [Navigation & Routing](#11-navigation--routing)
12. [Functional Specifications](#12-functional-specifications)
13. [Edit Mode Specification](#13-edit-mode-specification)
14. [Interchange & Backup](#14-interchange--backup)
15. [MVP Scope](#15-mvp-scope)
16. [Project File Structure](#16-project-file-structure)
17. [Accessibility](#17-accessibility)
18. [Word Prediction (v1.1)](#18-word-prediction-v11)
19. [Core Vocabulary Page Set Design](#19-core-vocabulary-page-set-design-v10)

---

## 1. Project Overview

**App Name:** SayThrough
**Platform:** Web (PWA), iOS, and Android — one React Native + Expo codebase
**Delivery order:** Phase 1 ships the installable web PWA (react-native-web);
Phase 2 ships the same codebase as native iOS/Android apps via EAS Build.
**Purpose:** A free, open-source Augmentative and Alternative Communication
app for children and adults with speech and language disabilities.

**License:** MIT (application code) · CC BY-NC-SA 4.0 (ARASAAC symbols) · CC BY-SA 4.0 (Mulberry symbols)

**Core promise:**
- Free forever — no subscription, no paywall on communication
- Works fully offline after first launch
- Usable by a non-verbal child within minutes of install

**Target devices:**
- Phase 1 — web PWA: Chrome, Safari, Firefox, Edge on iPad, Chromebook,
  Mac, Windows, Linux, and Android tablets (installable to home screen)
- Phase 2 — native: iPad/iPhone (iOS 15+), Android tablet/phone (Android 9+)

---

## 2. Tech Stack

### Core Framework
| Technology | Version | Purpose |
|---|---|---|
| Expo SDK | 52+ | Build tooling, native API access, OTA updates |
| React Native | 0.76+ | Cross-platform UI framework (iOS + Android) |
| react-native-web | latest | Renders React Native components in the browser |
| TypeScript | 5.x | Type safety across the entire codebase |

### Key Libraries
| Library | Purpose |
|---|---|
| `expo-speech` | Native TTS (AVSpeechSynthesizer on iOS, Android TTS) |
| `expo-file-system` | Local file storage for extracted symbols |
| `expo-asset` | Access bundled app assets (symbols.zip) |
| `expo-sqlite` | Local relational storage for vocabulary data |
| `expo-image` | High-performance image display with caching |
| `expo-audio` | Audio playback for recorded button audio (replaces deprecated `expo-av`) |
| `react-native-zip-archive` | Extract symbols.zip on first launch (native builds only — Phase 2) |
| `zustand` | Lightweight global state management |
| `react-navigation` | Screen navigation (Native Stack) |
| `@react-native-async-storage/async-storage` | Key-value storage for settings/flags |
| `expo-haptics` | Tactile feedback on button press |
| `expo-keep-awake` | Prevent screen sleep during communication |
| `expo-sharing` | Share exported .obz files |
| `expo-document-picker` | Import .obz files |

### Development & Build
| Tool | Purpose |
|---|---|
| EAS Build | Cloud build service for App Store / Play Store |
| EAS Submit | Automated app store submission |
| EAS Update | Over-the-air JS bundle updates |
| Jest (jest-expo preset) + React Native Testing Library | Unit, hook, and component testing (one runner — Vitest can't render RN components) |
| Playwright | End-to-end testing against the web build; Maestro planned for native E2E (Phase 2) |
| ESLint + Prettier | Code style enforcement |

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       SayThrough App                         │
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐  │
│  │   Screens   │   │  Components │   │   State (Zustand)│  │
│  │  (React     │──▶│  (React     │──▶│  - vocabulary   │  │
│  │   Native)   │   │   Native)   │   │  - navigation   │  │
│  └─────────────┘   └─────────────┘   │  - settings     │  │
│                                       │  - tracking     │  │
│  ┌─────────────────────────────────┐  └─────────────────┘  │
│  │         Service Layer           │                        │
│  │  TTSService  │  SymbolService   │                        │
│  │  StorageService │ TrackingService│                       │
│  └─────────────────────────────────┘                        │
│                                                             │
│  ┌─────────────────────────────────┐                        │
│  │         Persistence Layer       │                        │
│  │  SQLite (vocabulary/pages)      │                        │
│  │  FileSystem (symbol images)     │                        │
│  │  AsyncStorage (settings/flags)  │                        │
│  └─────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
┌─────────────────┐      ┌────────────────────┐
│  Device TTS     │      │  Self-hosted symbol │
│  (AVSpeech /    │      │  assets (same       │
│   Android TTS)  │      │  origin — web only) │
└─────────────────┘      └────────────────────┘
```

### Data Flow — Button Tap to Speech

```
User taps button
      │
      ▼
SymbolButton.onPress()
      │
      ├─▶ Append label to MessageBar (always)
      │         └─▶ User presses Speak ──▶ TTSService.speak(message)
      │
      └─▶ TTSService.speak(label) (additionally, if speak-on-select ON)
                │
                ▼
         expo-speech.speak()
                │
                ▼
         Native TTS Engine
         (AVSpeechSynthesizer / Android TTS)
                │
                ▼
         Audio output (< 200ms from tap)
```

### Storage Strategy

#### iOS / Android (Phase 2 — native builds)
```
App Bundle (shipped with app binary, ~180 MB total)
  assets/symbols.zip          ← 13,500 ARASAAC symbols, compressed
  assets/coreSymbols/         ← ~200 core symbols also require()'d for instant use
  assets/symbolIndex.json     ← { id, keywords[], category } for all symbols
  assets/vocabulary/
    core-vocabulary.obf       ← bundled Core vocabulary page set
    quick-phrases.obf         ← bundled Quick Phrases page set

Device Storage (written on first launch and ongoing)
  FileSystem.documentDirectory/
    symbols/
      arasaac/
        2788.webp             ← extracted ARASAAC symbols (all 13,500, WebP)
        4133.webp
        ...
      mulberry/               ← ~3,000 Mulberry symbols (WebP)
    userSymbols/
      custom_001.jpg          ← user-added photos as button symbols

  SQLite: saythrough.db
    users, page_sets, pages, buttons, word_lists,
    word_list_items, tracking_events
    (button actions are stored in buttons.actions_json — no separate table)

  AsyncStorage
    @saythrough/symbolsReady   ← 'true' after first-launch extraction
    @saythrough/activeUserId   ← currently selected user profile ID
    @saythrough/appSettings    ← global app settings JSON
```

#### Web (PWA) — Phase 1 primary target
```
App Bundle (served from static hosting)
  assets/coreSymbols/         ← ~200 core symbols bundled (used on core vocab pages)
  assets/symbolIndex.json     ← symbol metadata for search
  assets/vocabulary/
    core-vocabulary.obf
    quick-phrases.obf
  symbols/arasaac/{id}.webp     ← full ARASAAC + Mulberry libraries as
  symbols/mulberry/{name}.webp     same-origin static files (~180 MB,
                                   fetched on demand — see below)

Browser Storage
  IndexedDB (via expo-sqlite/web)
    ← same schema as SQLite on native
  Cache API / Service Worker
    ← core symbol images cached on first load
    ← all other symbols fetched on demand from SELF-HOSTED same-origin
       static assets (/symbols/arasaac/{id}.webp) and cached
    ← Mulberry: same pattern (/symbols/mulberry/{name}.webp)

  DECIDED (July 2026): the full symbol libraries (ARASAAC + Mulberry) are
  self-hosted with the PWA rather than loaded from third-party CDNs at
  runtime. School content
  filters routinely block unlisted third-party domains, and district
  privacy reviews ask what third parties an app calls. Same-origin
  assets mean one domain to whitelist, zero third-party requests at
  runtime, one format everywhere (WebP), and a simpler service worker.
  CC BY-NC-SA permits non-commercial redistribution with attribution
  (shown in Settings → About). Hosting cost: ~180 MB / ~17,000 static
  files — within free tiers (GitHub Pages, Cloudflare Pages).

On-demand symbol loading (web only):
  - Core page symbols (~200): bundled with the app shell, instantly offline
  - All other symbols: fetched from same-origin static assets when first
    displayed, cached in browser Cache API for subsequent offline use
  - Active page set: all symbols it references are pre-cached in the
    background at load time, so the user's own vocabulary works offline
    even on pages not yet visited
  - Optional "Download all symbols for offline use" (Settings → Storage):
    fetches the full libraries (~180 MB) into the Cache API with a progress
    bar; requests navigator.storage.persist() to reduce eviction risk
  - Symbol search results (edit mode): same-origin static assets — works
    on filtered school networks
```

---

## 4. Data Models

All models are defined as TypeScript interfaces and map directly to SQLite tables.

### 4.1 User Profile

```typescript
interface UserProfile {
  id: string                    // UUID
  name: string                  // Display name
  avatarUri?: string            // Local file URI to avatar photo
  createdAt: number             // Unix timestamp
  updatedAt: number

  // Active vocabulary
  activePageSetId: string       // FK → PageSet.id

  // Access method
  accessMethod: AccessMethod    // 'touch' | 'touch_enter' | 'touch_exit' |
                                //  'dwell' | 'scanning' | 'auditory_touch'
  scanSpeed: number             // ms between auto-scan advances (default 2000)
  dwellTime: number             // ms to hover before activation (default 1000)

  // Touch accommodations (v1.0 — widen who can use plain touch before
  // scanning/dwell arrive in v1.1; requirements AM-01)
  touchHoldDuration: number     // ms a button must be held before it
                                // activates (default 0 = instant)
  touchDebounce: number         // ms after an activation during which
                                // further taps are ignored (default 0)
  ignoreSecondTouch: boolean    // ignore additional touches while one is
                                // in progress (palm / second-hand guard)

  // TTS settings
  ttsVoiceId: string            // Platform voice identifier
  ttsRate: number               // 0.1 – 2.0 (default 0.9)
  ttsPitch: number              // 0.5 – 2.0 (default 1.0)
  ttsVolume: number             // 0.0 – 1.0 (default 1.0)
  speakOnSelect: boolean        // Speak immediately on tap vs. accumulate

  // UI preferences
  language: string              // BCP-47 language tag ('en', 'es', etc.)
  bilingualLanguage?: string    // Second language for code-switching
  gridBordersVisible: boolean
  labelPosition: 'below' | 'above' | 'hidden'
  animationsEnabled: boolean
  hapticFeedback: boolean
  messageBarPosition: 'top' | 'bottom'      // bottom = easier reach on
                                            // mounted devices
  toolbarItems: ToolbarSection[]            // visible toolbar buttons (§6.5)
  buttonGap: 'compact' | 'normal' | 'wide'  // grid spacing — wide reduces
                                            // mis-hits (pairs with touch
                                            // accommodations)
  labelTextScale: number                    // 0.8–1.5 button-label multiplier
  preferredSkinTone?: number                // 1–6; default variant shown for
                                            // person symbols (§9.4)

  // Security — PINs are child-proofing, not security (see §13.1)
  editPinHash?: string          // SHA-256(salt:pin) via expo-crypto
  editPinSalt?: string
  filterPinHash?: string        // SHA-256(salt:pin) via expo-crypto
  filterPinSalt?: string

  // Vocabulary filter
  activeWordListId?: string     // FK → WordList.id (null = filter off)
  filterEnabled: boolean

  // Data tracking
  trackingEnabled: boolean      // default FALSE — caregiver must opt in
                                // (COPPA/GDPR consent; requirements DT-05)
  modelingMode: boolean         // SLP modeling — tracked separately
}

type AccessMethod =
  | 'touch'
  | 'touch_enter'
  | 'touch_exit'
  | 'dwell'
  | 'scanning'
  | 'auditory_touch'
```

### 4.2 Page Set

```typescript
interface PageSet {
  id: string                    // UUID
  userId: string                // FK → UserProfile.id (null = bundled/shared)
  name: string                  // e.g. "Core Vocabulary"
  description?: string
  language: string              // BCP-47 ('en', 'es', 'en-es' for bilingual)
  rootPageId: string            // FK → Page.id — the home/start page
  schemaVersion: number         // For future migrations
  isBuiltIn: boolean            // true = shipped with app; false = user-created
  createdAt: number
  updatedAt: number
  obfVersion: string            // OBF spec version for export compatibility
}
```

### 4.3 Page

```typescript
interface Page {
  id: string                    // UUID
  pageSetId: string             // FK → PageSet.id
  name: string                  // e.g. "Food", "Home", "Feelings"
  symbolId?: string             // Namespaced symbol ref, e.g. 'arasaac:2788'
                                // or 'mulberry:apple'
  customSymbolUri?: string      // Local URI if user set a custom symbol

  // Grid configuration
  rows: number                  // e.g. 4
  columns: number               // e.g. 5  →  4×5 = 20-button grid
  backgroundColor: string       // Hex color string (default '#FFFFFF')

  // UI options
  showMessageBar: boolean       // Can hide message bar on specific pages
  showToolbar: boolean

  isBuiltIn: boolean
  createdAt: number
  updatedAt: number
}
```

### 4.4 Button

```typescript
interface Button {
  id: string                    // UUID
  pageId: string                // FK → Page.id
  row: number                   // 0-indexed grid position
  column: number                // 0-indexed grid position
  rowSpan: number               // default 1 (multi-cell buttons > 1)
  columnSpan: number            // default 1

  // Content
  label: string                 // Text displayed and spoken (if no audio)
  symbolId?: string             // Namespaced symbol ref, e.g. 'arasaac:2788'
  customSymbolUri?: string      // User photo or web image (local URI)
  audioUri?: string             // Recorded audio (overrides TTS)
  audioCueUri?: string          // Cue spoken during scanning highlight

  // Styling
  backgroundColor: string       // Hex — overrides page default
  borderColor: string           // Hex
  borderWidth: number           // px (default 1)
  labelColor: string            // Hex (default '#000000')
  labelFontSize: number         // sp (default 14)
  labelFontWeight: 'normal' | 'bold'
  labelPosition: 'below' | 'above' | 'hidden' | 'inherit'
  symbolScale: number           // 0.5–1.0 (portion of button height)

  // Behavior
  isHidden: boolean             // Hidden in use mode (still visible in edit)
  isNavigationButton: boolean   // Shows arrow indicator overlay
  actions: ButtonAction[]       // Ordered list of actions on tap

  isBuiltIn: boolean
  createdAt: number
  updatedAt: number
}
```

### 4.5 Button Action

```typescript
// Actions are stored as an ordered JSON array on the Button record
// Multiple actions execute sequentially on a single button tap

type ButtonAction =
  | { type: 'speak_label' }
  | { type: 'speak_message' }
  | { type: 'append_to_message'; text?: string }  // text defaults to button label
  | { type: 'navigate'; pageId: string }
  | { type: 'navigate_back' }
  | { type: 'navigate_home' }
  | { type: 'clear_message' }
  | { type: 'delete_last_word' }
  | { type: 'open_word_forms' }
  | { type: 'toggle_vocab_filter' }
  | { type: 'open_whiteboard' }
  | { type: 'open_schedule' }
  | { type: 'open_script'; scriptId: string }
  | { type: 'start_timer'; durationSeconds: number }
  | { type: 'open_photo_album' }
  | { type: 'open_rating_scale'; scaleId: string }
  | { type: 'open_url'; url: string }        // smart assistant, YouTube
  | { type: 'play_video'; uri: string }
  | { type: 'change_page_set'; pageSetId: string }
  | { type: 'change_user'; userId: string }
```

### 4.6 Word List (Vocabulary Filter)

```typescript
interface WordList {
  id: string
  userId: string                // FK → UserProfile.id
  name: string                  // e.g. "Week 1 Words", "Therapy Focus"
  createdAt: number
  updatedAt: number
}

interface WordListItem {
  id: string
  wordListId: string            // FK → WordList.id
  buttonId: string              // FK → Button.id
  // A word list maps to specific buttons, not just labels,
  // so the same word "eat" on different pages can be
  // included/excluded independently.
}
```

### 4.7 Tracking Event

```typescript
interface TrackingEvent {
  id: string
  userId: string                // FK → UserProfile.id
  timestamp: number             // Unix ms
  eventType: TrackingEventType
  buttonId?: string             // Which button was pressed
  buttonLabel?: string          // Snapshot of label at time of press
  pageId?: string               // Which page was active
  isModeling: boolean           // Was SLP modeling at time of event?
  accessMethod: AccessMethod    // How the selection was made (requirements DT-01)
  sessionId: string             // Groups events within a continuous session
}

type TrackingEventType =
  | 'button_press'
  | 'message_spoken'
  | 'page_navigated'
  | 'filter_enabled'
  | 'filter_disabled'
  | 'session_start'
  | 'session_end'
```

### 4.8 App Settings (AsyncStorage)

```typescript
interface AppSettings {
  onboardingComplete: boolean
  symbolsExtracted: boolean     // Has the ZIP been extracted on this device?
  symbolsVersion: string        // Which ARASAAC version is installed
  activeUserId: string          // Currently active user profile
  colorScheme: 'light' | 'dark' | 'system'
  uiScale: 'normal' | 'large'  // Global UI size multiplier
  keepAwake: boolean            // Prevent screen sleep (default true)
  kioskModeEnabled: boolean
  kioskPinHash?: string         // SHA-256(salt:pin) via expo-crypto
  kioskPinSalt?: string
}
```

---

## 5. Screen Specifications

### 5.1 First Launch Screen (native builds only — Phase 2)

**Shown:** Once only, on first open of a native (iOS/Android) build.
The web PWA skips this screen entirely — symbols stream from self-hosted
same-origin static assets and are cached on use; the optional full
offline pack download lives in Settings → Storage.
**Purpose:** Extract the bundled `symbols.zip` to device storage.

```
┌──────────────────────────────────────────┐
│                                          │
│         [SayThrough logo]                 │
│                                          │
│      Setting up SayThrough            │
│   Preparing symbol library...            │
│                                          │
│   ████████████████░░░░░░  68%            │
│                                          │
│   This only happens once.                │
│   Please keep the app open.              │
│                                          │
└──────────────────────────────────────────┘
```

**Behavior:**
- No user interaction needed or possible
- Progress bar updates as ZIP is extracted
- On completion → navigate to Onboarding (if first time) or Communication screen
- If extraction fails → show retry button with error message
- Background: white. Text: large, readable. No distractions.

---

### 5.2 Onboarding Screen

**Shown:** Once, after symbol extraction, before first use.
**Purpose:** Create the first user profile and select a starting vocabulary.

**Steps:**
1. Welcome screen ("Let's set up a voice") — includes "Try SayThrough":
   opens the Core Vocabulary set in a guest session (nothing saved, no
   profile — requirements §4.14 guest mode; a persistent banner offers
   "Set up for real" → returns here). Lets an SLP or parent evaluate the
   app in 30 seconds from a link.
2. Enter user's name + optionally take/choose avatar photo
3. Select a starting vocabulary:
   - Core Vocabulary (recommended for most users)
   - Quick Phrases (simpler, phrase-focused)
   - Blank (start from scratch)
4. Select grid size (3×4 / 4×5 / 5×6 / 6×7) with visual preview — shown
   only when "Blank" is selected. The bundled page sets are authored at a
   fixed 5×6 grid; motor-plan layouts cannot be reflowed automatically
   (see §19.2). Additional authored sizes arrive in v1.1.
5. Set a caregiver PIN (recommended, skippable) — protects edit mode and
   settings; the screen explains that without a PIN, a long-press on any
   button opens edit mode directly
6. Done → go to Communication screen

---

### 5.3 Communication Screen ← PRIMARY SCREEN

This is the screen the child uses every day. It must be fast, clear, and
impossible to accidentally break.

```
┌─────────────────────────────────────────────────────────┐
│  TOP BAR                                                │  ~44pt tall
│  [←] [⌂] [🔍]                    [⊘ Filter] [⚙ Edit]  │
├─────────────────────────────────────────────────────────┤
│  MESSAGE BAR                                            │  ~80pt tall
│  [🍎eat] [🙏want] [🍌more]    [▶ SPEAK]  [✕]  [⌫]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐   │
│  │  [I]  │ │ [you] │ │ [he]  │ │ [she] │ │ [we]  │   │
│  │   I   │ │  you  │ │  he   │ │  she  │ │  we   │   │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘   │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐   │
│  │[want] │ │ [go]  │ │[like] │ │[feel] │ │[make] │   │
│  │ want  │ │  go   │ │ like  │ │ feel  │ │ make  │   │  SYMBOL
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘   │  GRID
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐   │
│  │[more] │ │[help] │ │[stop] │ │[good] │ │ [big] │   │
│  │ more  │ │ help  │ │ stop  │ │ good  │ │  big  │   │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘   │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐   │
│  │[Food➜]│ │[Play➜]│ │[Peop➜]│ │[Feel➜]│ │[Plac➜]│  │
│  │ Food  │ │ Play  │ │People │ │Feeling│ │Places │   │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  TOOLBAR                                                │  ~56pt tall
│  [←Back] [⌂Core] [⚡Quick] [📋Topics] [⌨Keys] [±Forms] │
└─────────────────────────────────────────────────────────┘
```

**Top Bar — detailed spec:**
- Height: 44pt
- Background: #F8F8F8 (light gray)
- Border bottom: 1px #E0E0E0
- Buttons: Back (←), Home (⌂), Search (🔍) on LEFT side
- Buttons: Vocabulary Filter toggle, Edit Mode (⚙) on RIGHT side
- Edit button is PIN-protected — tapping shows PIN entry dialog
- Entire top bar can be hidden via settings (for distraction-free use)
- When hidden: triple-tap top-left corner to access emergency Edit entry

**Message Bar — detailed spec:**
- Height: 80pt (taller if symbol display is enabled)
- Background: #FFFFFF
- Border bottom: 2px #CCCCCC
- Left region: scrollable horizontal list of tapped word tokens
  - Each token: symbol image (32×32pt) + text label below, in a rounded pill
  - Tokens appear left-to-right in tap order
  - Scrollable when message is long
- Right region (fixed): SPEAK button, Clear button, Backspace button
  - SPEAK button: large, green (#4CAF50), rounded, "▶ Speak" label
  - Clear button: medium, red (#F44336), "✕"
  - Backspace button: medium, gray, "⌫"
- Long-press on the message text: Copy (clipboard) and Share (Web Share
  API / native share sheet) — how users hand a message to someone not in
  the room (text message, email, Google Classroom)
- Message bar visibility is per-page configurable

**Symbol Grid — detailed spec:**
- Fills remaining screen space between message bar and toolbar
- Buttons sized dynamically: `(screenWidth - padding) / columns`
- Default padding: 8pt on all sides, 4pt gap between buttons
- Minimum button size: 60×60pt
- Each button:
  - Rounded corners: 8pt radius
  - Symbol image: centered, fills top 65% of button height
  - Label text: bottom 35%, centered horizontally
  - Font: System font, bold, 12–14sp (scales with grid density)
  - Border: 1px #DDDDDD
  - Navigation buttons (link to another page): small arrow icon ➜
    overlaid in bottom-right corner of button
  - Press state: slight scale-down (0.95) + opacity (0.85) for 100ms

**Part-of-speech color coding:**

| Category | Background Color | Hex |
|---|---|---|
| Questions | Blue | #BBDEFB |
| Pronouns | Yellow | #FFF9C4 |
| Verbs | Green | #C8E6C9 |
| Little words / prepositions | Orange | #FFE0B2 |
| Social / pragmatic | Pink | #F8BBD9 |
| Descriptors / adjectives | Purple | #E1BEE7 |
| Nouns / fringe vocabulary | White | #FFFFFF |
| Category navigation buttons | Light gray | #F5F5F5 |

**Toolbar — detailed spec:**
- Height: 56pt
- Background: #F8F8F8
- Border top: 1px #E0E0E0
- 6 equally-spaced icon+label buttons
- Active/current section indicator (underline or tinted)
- Items: Back, Core, Quick, Topics, Keys, Forms
  (Forms is hidden until Word Forms ships in v1.1 — the v1.0 toolbar
   shows only shipped features)
- Toolbar can be configured to show/hide individual items

---

### 5.4 Topic Browser Screen

Accessed by tapping the Topics toolbar button or any Topics navigation button.

```
┌─────────────────────────────────────────────────────────┐
│  [← Back]    Topics                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   [fork]    │  │  [soccer]   │  │   [house]   │    │
│  │    Food     │  │   Sports    │  │    Home     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   [book]    │  │  [doctor]   │  │  [holiday]  │    │
│  │   School    │  │   Health    │  │  Holidays   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│   ...                                                   │
└─────────────────────────────────────────────────────────┘
```

---

### 5.5 Keyboard Screen

Accessed via toolbar Keys button or keyboard navigation button.

**In v1.0** this is the basic keyboard: QWERTY, typed text enters the
message bar as a token, Speak speaks it. This is the escape hatch for any
word that doesn't have a button — without it, users hit a wall the first
time they need a word outside the vocabulary. The prediction bar shown in
the mockup and the ABC/frequency-sorted layouts arrive in v1.1 (§18).

```
┌─────────────────────────────────────────────────────────┐
│  TOP BAR                                                │
├─────────────────────────────────────────────────────────┤
│  MESSAGE BAR (with typed text shown as single token)    │
├─────────────────────────────────────────────────────────┤
│  WORD PREDICTION BAR                                    │
│  [ running ] [ run ] [ runs ] [ runner ] [ ran ]        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   [Q][W][E][R][T][Y][U][I][O][P]                       │
│    [A][S][D][F][G][H][J][K][L]                         │
│  [⇧][Z][X][C][V][B][N][M][⌫]                          │
│  [123][   space   ][.][▶ Speak]                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- Word prediction bar shows top 5 suggestions
- Tapping a prediction appends the word and speaks it
- Keyboard layouts: QWERTY (default), ABC, frequency-sorted
- Layout selector accessible via long-press on space bar

---

### 5.6 Edit Mode Screen

Activated by tapping the Edit button in the top bar (PIN-required).

```
┌─────────────────────────────────────────────────────────┐
│  EDIT BAR (replaces top bar)                            │
│  [✓ Done]  Editing: Food Page  [+ Add] [🗑] [⚙ Page]   │
├─────────────────────────────────────────────────────────┤
│  (message bar hidden in edit mode)                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌ ─ ─ ─ ┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌ ─ ─ ─ ┐  │
│            │ [egg] │ │[milk] │ │[juice]│              │
│  │(empty)│ │  egg  │ │ milk  │ │ juice │ │(empty)│   │
│            └───────┘ └───────┘ └───────┘              │
│  └ ─ ─ ─ ┘ ╔═══════╗ ┌───────┐ ┌───────┐ └ ─ ─ ─ ┘  │
│             ║[pizza]║ │[pasta]│ │[bread]│              │
│             ║ pizza ║ │ pasta │ │ bread │              │
│             ╚═══════╝ └───────┘ └───────┘              │
│                  ▲                                      │
│             (selected:                                  │
│              blue border)                               │
└─────────────────────────────────────────────────────────┘
       │
       ▼  (when button selected, slide-up panel appears)
┌─────────────────────────────────────────────────────────┐
│  BUTTON EDITOR PANEL                                    │
│                                                         │
│  Label:  [ pizza              ]                         │
│  Symbol: [🍕] [Change Symbol] [Take Photo]              │
│  Color:  [🔴][🟠][🟡][🟢][🔵][🟣][⚪] [Custom]       │
│  Action: [Speak Label ▼]  [+ Add Action]               │
│                                                         │
│  [Delete Button]                        [Done]         │
└─────────────────────────────────────────────────────────┘
```

**Edit mode behaviors:**
- Dashed borders on empty cells — tap to add a button there
- Solid blue border on selected button
- Drag a button to swap it with another position
- Long-press a button to start dragging
- Edit bar shows current page name and page-level actions
- "Done" exits edit mode and saves all changes automatically
- All changes are immediately persisted — no separate "Save"
- Undo/Redo available (min 25 steps) via shake gesture or Edit bar

---

### 5.7 Symbol Picker Screen

Opened when tapping "Change Symbol" in the Button Editor panel.

```
┌─────────────────────────────────────────────────────────┐
│  [← Cancel]   Choose Symbol         [✓ Done]           │
│  🔍 [ Search symbols...                              ]  │
│  [ARASAAC ▼]  [All categories ▼]   [Color] [B&W]       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │  🍕  │ │  🍕  │ │  🍕  │ │  🍕  │ │  🍕  │         │
│  │pizza │ │pizza2│ │ pie  │ │ food │ │ meal │         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │  🍝  │ │  🥗  │ │  🥪  │ │  🍞  │ │  🍔  │         │
│  │pasta │ │salad │ │sandw.│ │bread │ │burger│         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
│                                                         │
│  [📷 Use Camera]          [🖼 Use Photo Library]        │
└─────────────────────────────────────────────────────────┘
```

- Search is local (offline) — searches symbolIndex.json
- Results show matching ARASAAC symbols
- If online: optional "Search web images" tab
- Selected symbol shown with checkmark
- Skin tone / hair color pickers appear for person symbols
  (v1.0: available for the ~200 core-set person symbols — see §9.4;
   defaults to the profile's preferredSkinTone)

---

### 5.8 Settings Screen

Accessible via Edit mode only (prevents child from changing settings).

**Sections:**
1. **User Profile** — name, avatar, manage profiles, add profile
2. **Vocabulary** — active page set, grid size, color coding on/off
3. **Speech** — voice selection with per-voice preview (▶ plays a sample
   sentence), rate, pitch, volume, speak-on-select
4. **Access Method** — touch accommodations (hold duration, repeat-tap
   debounce, second-touch guard); dwell/scanning config arrives v1.1
5. **Display** — label position, label text scale, message bar position,
   button gap, button borders, animation, UI scale
6. **Vocabulary Filter** — manage word lists, set/clear PIN
7. **Security** — edit PIN, kiosk mode, top bar lock
8. **Data Tracking** — off by default; caregiver opt-in with consent note, modeling mode, export data
9. **Backup & Restore** — export .obz, import .obz
10. **About** — version, licenses, ARASAAC attribution

---

### 5.9 Data Tracking Dashboard

Accessible via top bar Data Tracking button (when tracking enabled).

```
┌─────────────────────────────────────────────────────────┐
│  [← Back]    Communication Data     [Export CSV]        │
│                                                         │
│  [Today] [This Week] [This Month] [Custom Range]        │
├─────────────────────────────────────────────────────────┤
│  Today: 47 button presses  |  12 messages spoken        │
│  ████░░░░░░░░░░░░  Most active: 10am–11am               │
├─────────────────────────────────────────────────────────┤
│  Most Used Words                                        │
│  1. want (14)    2. more (11)    3. eat (8)             │
│  4. help (6)     5. go (5)       6. no (5)             │
├─────────────────────────────────────────────────────────┤
│  Activity Calendar                                      │
│   M  T  W  T  F  S  S                                  │
│  [░][░][█][░][█][░][░]  ← color intensity = activity   │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Component Specifications

### 6.1 SymbolButton

The fundamental interactive unit of the entire app.

```typescript
interface SymbolButtonProps {
  button: Button
  isEditMode: boolean
  isSelected: boolean           // edit mode: shows blue border
  isHidden: boolean             // vocab filter: dims/hides button
  isHighlighted: boolean        // scanning: shows scan highlight
  onPress: (button: Button) => void
  onLongPress?: (button: Button) => void  // enters edit mode
  size: { width: number; height: number }
}
```

**Rendering logic:**
```
1. Determine symbol source:
   a. If button.audioUri exists → play audio instead of TTS
   b. If button.customSymbolUri → use local file URI
   c. If button.symbolId → resolve via SymbolService.getSymbolUri(ref)
      (native: symbols/{library}/{id}.webp; web: cached CDN URL or
       self-hosted static asset — see §9.4)
   d. If none → render text-only button (label centered, no image)

2. Render button:
   - TouchableOpacity (or Pressable) wrapping:
       - expo-image <Image> for symbol (top 65%)
       - <Text> for label (bottom 35%)
       - Navigation arrow overlay (if isNavigationButton)
       - Selection border overlay (if isSelected in edit mode)
       - Scan highlight overlay (if isHighlighted)
       - Hidden overlay — semi-transparent gray (if isHidden)

3. On press (use mode):
   - Apply touch accommodations first: require touchHoldDuration if set,
     ignore taps within touchDebounce of the last activation, ignore
     additional touches while one is in progress (if ignoreSecondTouch)
   - Haptic feedback (if enabled)
   - Scale animation: 0.95 for 100ms
   - Execute button.actions in sequence

4. On long press (use mode):
   - If editPinHash set: show PIN entry dialog
   - If no PIN: enter edit mode directly

5. On press (edit mode):
   - If not selected: select this button (show blue border)
   - If already selected: open Button Editor panel
```

### 6.2 SymbolGrid

```typescript
interface SymbolGridProps {
  page: Page
  buttons: Button[]
  isEditMode: boolean
  selectedButtonId: string | null
  onButtonPress: (button: Button) => void
  onButtonLongPress: (button: Button) => void
  onEmptyCellPress: (row: number, col: number) => void  // edit mode only
}
```

**Layout calculation:**
```typescript
const buttonWidth = (screenWidth - PADDING * 2 - GAP * (columns - 1)) / columns
const buttonHeight = (availableHeight - GAP * (rows - 1)) / rows

// availableHeight = screenHeight
//   - topBarHeight (44)
//   - messageBarHeight (80)
//   - toolbarHeight (56)
//   - statusBarHeight (varies)
```

### 6.3 MessageBar

```typescript
interface MessageBarProps {
  tokens: MessageToken[]           // accumulated words
  onSpeak: () => void
  onClear: () => void
  onDeleteLast: () => void
  onCopy: () => void               // clipboard
  onShare: () => void              // Web Share API / native share sheet
  speakOnSelect: boolean           // if true, each word also speaks as it is
                                   // added; Speak button still speaks the
                                   // full accumulated message
}

interface MessageToken {
  text: string
  symbolId?: string              // namespaced ref, e.g. 'arasaac:2788'
  customSymbolUri?: string
}
```

### 6.4 TopBar

```typescript
interface TopBarProps {
  canGoBack: boolean
  onBack: () => void
  onHome: () => void
  onSearch: () => void
  filterEnabled: boolean
  onToggleFilter: () => void
  onEditMode: () => void           // triggers PIN check
  isEditMode: boolean
  isVisible: boolean
}
```

### 6.5 Toolbar

```typescript
interface ToolbarProps {
  activeSection: ToolbarSection
  onBack: () => void
  onCoreWords: () => void
  onQuickFires: () => void
  onTopics: () => void
  onKeyboard: () => void
  onWordForms: () => void
  visibleItems: ToolbarSection[]   // configurable per user
}

type ToolbarSection =
  | 'back' | 'core' | 'quick' | 'topics' | 'keyboard' | 'forms'
```

---

## 7. State Management

Using **Zustand** with separate stores per concern. All stores are persisted
to AsyncStorage or SQLite where appropriate.

### 7.1 Navigation Store

```typescript
interface NavigationStore {
  currentPageId: string
  pageHistory: string[]           // stack for back navigation
  navigateTo: (pageId: string) => void
  navigateBack: () => void
  navigateHome: () => void
  activePageSetId: string
}
```

### 7.2 Message Store

```typescript
interface MessageStore {
  tokens: MessageToken[]
  appendToken: (token: MessageToken) => void
  deleteLastToken: () => void
  clearMessage: () => void
  speakMessage: () => void
  isSpeaking: boolean
}
```

### 7.3 User Store

```typescript
interface UserStore {
  activeUser: UserProfile | null
  allUsers: UserProfile[]
  setActiveUser: (userId: string) => void
  updateUser: (userId: string, changes: Partial<UserProfile>) => void
  createUser: (profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => void
  deleteUser: (userId: string) => void
}
```

### 7.4 Edit Store

```typescript
interface EditStore {
  isEditMode: boolean
  selectedButtonId: string | null
  undoStack: EditAction[]
  redoStack: EditAction[]
  enterEditMode: () => void
  exitEditMode: () => void
  selectButton: (buttonId: string | null) => void
  undo: () => void
  redo: () => void
}
```

### 7.5 Tracking Store

```typescript
interface TrackingStore {
  isEnabled: boolean
  isModelingMode: boolean
  currentSessionId: string
  sessionStartTime: number
  logButtonPress: (button: Button, pageId: string) => void
  logMessageSpoken: (message: string) => void
  toggleModelingMode: () => void
}
```

---

## 8. Storage & Persistence

> **Web platform note:** `expo-sqlite` is not available in the browser. The web build uses a
> storage abstraction layer (`StorageService`) backed by IndexedDB (via `expo-sqlite/web` or
> a Dexie.js adapter). The schema and TypeScript interfaces are identical across platforms;
> only the underlying driver differs. Because browsers may evict site data under storage
> pressure, the web build requests `navigator.storage.persist()` on first run, prompts the
> user to install the PWA to the home screen (installed PWAs get stronger persistence),
> and surfaces the one-tap `.obz` backup prominently in Settings.

### 8.1 SQLite Schema

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_uri TEXT,
  active_page_set_id TEXT,
  settings_json TEXT NOT NULL,  -- serialized UserProfile settings
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Page Sets
CREATE TABLE page_sets (
  id TEXT PRIMARY KEY,
  user_id TEXT,                 -- NULL for built-in page sets
  name TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  root_page_id TEXT NOT NULL,
  is_built_in INTEGER NOT NULL DEFAULT 0,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Pages
CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  page_set_id TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol_id TEXT,               -- namespaced ref, e.g. 'arasaac:2788'
  custom_symbol_uri TEXT,
  rows INTEGER NOT NULL DEFAULT 4,
  columns INTEGER NOT NULL DEFAULT 5,
  background_color TEXT NOT NULL DEFAULT '#FFFFFF',
  show_message_bar INTEGER NOT NULL DEFAULT 1,
  show_toolbar INTEGER NOT NULL DEFAULT 1,
  is_built_in INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (page_set_id) REFERENCES page_sets(id) ON DELETE CASCADE
);

-- Buttons
CREATE TABLE buttons (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  row_index INTEGER NOT NULL,
  col_index INTEGER NOT NULL,
  row_span INTEGER NOT NULL DEFAULT 1,
  col_span INTEGER NOT NULL DEFAULT 1,
  label TEXT NOT NULL,
  symbol_id TEXT,               -- namespaced ref, e.g. 'arasaac:2788'
  custom_symbol_uri TEXT,
  audio_uri TEXT,
  audio_cue_uri TEXT,
  background_color TEXT NOT NULL DEFAULT '#FFFFFF',
  border_color TEXT NOT NULL DEFAULT '#DDDDDD',
  border_width INTEGER NOT NULL DEFAULT 1,
  label_color TEXT NOT NULL DEFAULT '#000000',
  label_font_size INTEGER NOT NULL DEFAULT 14,
  label_font_weight TEXT NOT NULL DEFAULT 'normal',
  label_position TEXT NOT NULL DEFAULT 'below',
  symbol_scale REAL NOT NULL DEFAULT 0.65,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  is_navigation_button INTEGER NOT NULL DEFAULT 0,
  actions_json TEXT NOT NULL DEFAULT '[]',  -- serialized ButtonAction[]
  is_built_in INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

-- Word Lists (Vocabulary Filter)
CREATE TABLE word_lists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE word_list_items (
  id TEXT PRIMARY KEY,
  word_list_id TEXT NOT NULL,
  button_id TEXT NOT NULL,
  FOREIGN KEY (word_list_id) REFERENCES word_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (button_id) REFERENCES buttons(id) ON DELETE CASCADE
);

-- Data Tracking
CREATE TABLE tracking_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  button_id TEXT,
  button_label TEXT,
  page_id TEXT,
  access_method TEXT,
  is_modeling INTEGER NOT NULL DEFAULT 0,
  session_id TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for tracking queries
CREATE INDEX idx_tracking_user_time ON tracking_events(user_id, timestamp);
CREATE INDEX idx_tracking_session ON tracking_events(session_id);
```

### 8.2 FileSystem Layout

```
FileSystem.documentDirectory
  symbols/
    arasaac/{id}.webp     ← 13,500 extracted ARASAAC symbols (WebP)
    mulberry/{name}.webp  ← ~3,000 Mulberry symbols
  userSymbols/
    {uuid}.jpg            ← user-captured photos for buttons
  exports/
    {date}-openvoice.obz  ← temporary export files before sharing
  audio/
    {button_id}.m4a       ← recorded button audio
```

### 8.3 AsyncStorage Keys

```typescript
const STORAGE_KEYS = {
  SYMBOLS_READY:      '@saythrough/symbolsReady',
  SYMBOLS_VERSION:    '@saythrough/symbolsVersion',
  ACTIVE_USER_ID:     '@saythrough/activeUserId',
  APP_SETTINGS:       '@saythrough/appSettings',
  ONBOARDING_DONE:    '@saythrough/onboardingComplete',
  KIOSK_PIN_HASH:     '@saythrough/kioskPinHash',
  KIOSK_PIN_SALT:     '@saythrough/kioskPinSalt',
} as const
```

---

## 9. Symbol Asset System

### 9.1 Build-Time Scripts (run once by developers)

```
scripts/
  1-downloadArasaacIndex.js     ← fetches all 13,500 IDs + keywords from API
  2-downloadSymbols.js          ← downloads {id}_500.png for each ID
  3-resizeSymbols.js            ← resizes to 300px (reduces size ~60%)
  4-convertToWebp.js            ← converts PNG → WebP (~30% further reduction)
  5-buildZip.js                 ← packages assets/symbols/ → assets/symbols.zip
  6-buildSymbolIndex.js         ← generates assets/symbolIndex.json
```

**symbolIndex.json structure:**
```json
[
  {
    "id": "arasaac:2788",
    "library": "arasaac",
    "keywords": ["eat", "eating", "food", "meal"],
    "category": "Food & Drink",
    "tags": ["action", "daily_life"]
  },
  ...~16,500 entries: 13,500 "arasaac:*" + ~3,000 "mulberry:*",
  built by the same pipeline
]
```

### 9.2 First-Launch Extraction

```typescript
// services/SymbolService.ts

import * as FileSystem from 'expo-file-system'
import { Asset } from 'expo-asset'
import { unzip } from 'react-native-zip-archive'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from '../constants/storage'

const SYMBOL_DIR = FileSystem.documentDirectory + 'symbols/'

export async function areSymbolsReady(): Promise<boolean> {
  const flag = await AsyncStorage.getItem(STORAGE_KEYS.SYMBOLS_READY)
  return flag === 'true'
}

export async function extractSymbols(
  onProgress: (progress: number) => void
): Promise<void> {
  // Get the bundled zip asset URI
  const [asset] = await Asset.loadAsync(require('../assets/symbols.zip'))
  if (!asset.localUri) throw new Error('Symbol ZIP asset not found')

  // Ensure destination directory exists
  await FileSystem.makeDirectoryAsync(SYMBOL_DIR, { intermediates: true })

  // Extract — react-native-zip-archive streams progress callbacks
  await unzip(asset.localUri, SYMBOL_DIR, (fileIndex, totalFiles) => {
    onProgress(fileIndex / totalFiles)
  })

  await AsyncStorage.setItem(STORAGE_KEYS.SYMBOLS_READY, 'true')
}

export function getSymbolUri(ref: string): string {
  // ref is namespaced: 'arasaac:2788', 'mulberry:apple'
  const [library, id] = ref.split(':')
  return `${SYMBOL_DIR}${library}/${id}.webp`
}

export async function searchSymbols(keyword: string): Promise<SymbolResult[]> {
  // symbolIndex is loaded into memory on app start (~2MB)
  const lower = keyword.toLowerCase()
  return symbolIndexCache
    .filter(entry => entry.keywords.some(k => k.includes(lower)))
    .slice(0, 50)
    .map(entry => ({
      id: entry.id,
      label: entry.keywords[0],
      uri: getSymbolUri(entry.id),
    }))
}
```

### 9.3 Symbol Display

```tsx
// Always use expo-image, not React Native's built-in Image
// expo-image handles local file URIs reliably on both platforms
// and includes memory-efficient caching

import { Image } from 'expo-image'

<Image
  source={{ uri: getSymbolUri(button.symbolId) }}
  style={{ width: '100%', height: '65%' }}
  contentFit="contain"
  cachePolicy="memory-disk"
  transition={100}
  // Show placeholder while loading (shouldn't be visible for local files
  // but handles edge cases gracefully)
  placeholder={require('../assets/symbol-placeholder.png')}
/>
```

### 9.4 Symbol Libraries & Formats

| Library | Size | License | Delivery | Phase |
|---|---|---|---|---|
| ARASAAC | ~13,500 | CC BY-NC-SA 4.0 | Web: self-hosted same-origin static assets (WebP) + optional offline pack. Native: bundled symbols.zip (WebP) | MVP |
| Mulberry | ~3,000 | CC BY-SA 4.0 | Web: self-hosted static assets deployed with the PWA (WebP). Native: added to symbols.zip | MVP |
| OpenSymbols API | 60,000+ | mixed open | Online search in edit mode only; selected images copied to userSymbols/ | v2.0 |

Format rules:
- Every symbol we package ourselves (symbols.zip, self-hosted web assets,
  bundled core symbols) is WebP at 300px.
- ARASAAC's CDN is not used at runtime — the build pipeline (§9.1) downloads
  from ARASAAC once; everything served to users is WebP from our own origin.
- Symbol refs are namespaced strings (`arasaac:2788`, `mulberry:apple`) so new
  libraries can be added without schema changes. OBF export always writes the
  underlying image file into the .obz, so interoperability is unaffected.
- Mulberry has no numeric IDs — symbols are keyed by filename (e.g.
  `mulberry:apple`). The build pipeline (§9.1) runs a parallel
  download/convert/merge step for Mulberry.

Person-symbol skin-tone variants (v1.0):
- The ~200 core-set symbols that depict people (I, you, boy, girl, mom,
  dad, feelings faces…) ship in ARASAAC's skin tone — and hair, where
  available — variants: a few hundred extra files, not a full-library
  explosion. A child should see themselves in the words they use most.
- Variant refs extend the namespace: 'arasaac:2475@skin3' →
  /symbols/arasaac/2475@skin3.webp via getSymbolUri()
- The symbol picker (§5.7) shows the variant picker for these symbols and
  defaults to the profile's preferredSkinTone; full-library variants are
  deferred until storage/hosting budgets allow.

---

## 10. Text-to-Speech Specification

> **Web platform note:** `expo-speech` delegates to the browser's Web Speech API
> (`window.speechSynthesis`) on the web target. Voice quality and available voices vary
> by browser/OS. The `TTSService` interface is identical; the underlying engine is
> platform-selected automatically by Expo.

### 10.1 TTSService

```typescript
// services/TTSService.ts
import * as Speech from 'expo-speech'
import { createAudioPlayer, type AudioPlayer } from 'expo-audio'

export class TTSService {
  private static instance: TTSService
  private currentPlayer: AudioPlayer | null = null

  async speak(
    text: string,
    options: {
      voiceId?: string            // platform voice identifier → Speech `voice`
      language?: string           // BCP-47 tag → Speech `language`
      rate?: number
      pitch?: number
      volume?: number
      onStart?: () => void
      onDone?: () => void
      onError?: (error: Error) => void
    } = {}
  ): Promise<void> {
    // Stop any in-progress speech first
    await this.stop()

    // `voice` and `language` are separate expo-speech options: a voice
    // identifier is NOT a BCP-47 language tag. Callers pass both from
    // the profile: { voiceId: user.ttsVoiceId, language: user.language }
    Speech.speak(text, {
      voice: options.voiceId,
      language: options.language ?? 'en-US',
      rate: options.rate ?? 0.9,
      pitch: options.pitch ?? 1.0,
      volume: options.volume ?? 1.0,
      onStart: options.onStart,
      onDone: options.onDone,
      onError: options.onError,
    })
  }

  async speakAudioFile(uri: string): Promise<void> {
    await this.stop()
    this.currentPlayer = createAudioPlayer({ uri })
    this.currentPlayer.play()
  }

  async stop(): Promise<void> {
    Speech.stop()
    if (this.currentPlayer) {
      this.currentPlayer.remove()   // releases native resources
      this.currentPlayer = null
    }
  }

  async getAvailableVoices(): Promise<Speech.Voice[]> {
    return Speech.getAvailableVoicesAsync()
  }
}
```

### 10.2 Voice Selection Logic

```typescript
// When user selects a voice, store its identifier from the platform list.
// iOS voices: e.g. 'com.apple.ttsbundle.Samantha-compact'
// Android voices: e.g. 'en-us-x-sfg-local'

// Default voice selection algorithm (implemented in voiceSelection.ts —
// the app must ALWAYS pick explicitly; with no voice specified the
// browser chooses, and on macOS that can be a novelty voice):
// 1. Find voices matching the user's language setting
// 2. EXCLUDE OS novelty/legacy voices ("Albert", "Fred", "Zarvox",
//    "Bubbles", … — macOS ships ~25 joke voices that must never be an
//    AAC user's voice; they also pollute the Settings picker)
// 3. Prefer neural/natural voices (Edge exposes "… Online (Natural)"),
//    then known high-quality names (Samantha, Ava, Google US English…),
//    then 'enhanced' quality
// 4. Prefer local voices (localService: true) as a tiebreak — network
//    voices add latency and FAIL OFFLINE
// 5. Filter by gender preference if set (future)
// 6. Persist the pick to the profile on first run so Settings shows
//    what is actually being used
```

### 10.3 Speak-on-Select Behavior

```typescript
// In MessageStore.appendToken():
// Speak-on-select speaks each word AND still accumulates it (matching
// TD Snap / Proloquo2Go) — immediate feedback without giving up
// sentence building. An earlier draft skipped accumulation; that would
// break composing multi-word messages in speak-on-select mode.
set(state => ({ tokens: [...state.tokens, token] }))
if (user.speakOnSelect) {
  TTSService.speak(token.text)
}
```

### 10.4 Engine Warm-up

Web Speech API engines have notorious first-utterance latency: the voice
list loads lazily and the first `speak()` call can take over a second —
which would blow the < 200 ms button-press→speech budget on the very
first word a child speaks. Mitigations, both required:

- On app start: call `getAvailableVoicesAsync()` immediately to force the
  voice list to load (on web, also listen for `voiceschanged`).
- On the first user interaction (any tap): speak a single space character
  at volume 0 to initialize the synthesis engine before the first real
  utterance.

---

## 11. Navigation & Routing

Using **React Navigation Native Stack** for screen-level navigation,
and a **custom page navigation system** for vocabulary page traversal
(since vocabulary pages aren't React Navigation screens — they're all
rendered in the same CommunicationScreen, just switching which Page
data is loaded).

### 11.1 React Navigation Stack

```
Root Navigator (Native Stack)
  ├── FirstLaunchScreen       ← shown if !symbolsExtracted
  ├── OnboardingScreen        ← shown if !onboardingComplete
  └── MainApp (Tab Navigator or just Stack)
        ├── CommunicationScreen   ← default screen
        ├── SettingsScreen
        ├── DataTrackingScreen
        ├── ProfileScreen
        └── ImportExportScreen
```

### 11.2 Vocabulary Page Navigation

Page navigation is handled by NavigationStore, not React Navigation.
The CommunicationScreen renders whichever Page the store says is current.

```typescript
// On button tap with navigate action:
navigationStore.navigateTo(action.pageId)
// → triggers re-render of SymbolGrid with new page's buttons
// → pushes current page onto pageHistory stack

// On Back button:
navigationStore.navigateBack()
// → pops pageHistory stack

// On Home button:
navigationStore.navigateHome()
// → sets currentPageId = activePageSet.rootPageId
// → clears pageHistory
```

---

## 12. Functional Specifications

### 12.1 Core Communication Flow

```
1. App opens → CommunicationScreen shows active user's root page
2. Child taps a button
   a. Haptic feedback fires (if enabled)
   b. Button press animation plays (scale 0.95, 100ms)
   c. button.actions execute in order:
      - append_to_message → token appears in message bar
      - speak_label → TTS fires immediately (speak-on-select mode)
      - navigate → grid switches to linked page
   d. TrackingService.logButtonPress() fires (if tracking enabled)
3. Message bar accumulates tokens
4. Child (or caregiver) taps Speak button
   a. Full message text is assembled from token labels
   b. TTSService.speak(fullMessage) fires
   c. TrackingService.logMessageSpoken() fires
5. Message stays in bar until:
   a. Child taps Clear (✕) → message erased
   b. Child taps Backspace (⌫) → last token removed
```

### 12.2 Vocabulary Filter Flow

```
1. SLP enters edit mode (PIN required)
2. Opens Settings → Vocabulary Filter
3. Creates a new Word List ("Week 3 Focus Words")
4. Browses vocabulary, taps buttons to add them to the list
5. Saves word list, exits settings
6. Taps the Filter toggle in top bar
7. App prompts for Filter PIN (if set) before activating
8. Filter activates: buttons NOT in the active word list
   appear dimmed (50% opacity) and are non-interactive
   (still visible so teacher can point to them and model)
9. To deactivate: tap Filter toggle again (PIN required if set)
```

### 12.3 Edit Mode — Button Actions

```
Add a button:
  1. Tap empty cell (dashed outline) in edit mode
  2. Button Editor panel slides up with default values
  3. User sets label, symbol, color, action
  4. Taps Done → button saved to SQLite, grid re-renders

Change a symbol:
  1. Select button (tap once for selection, tap again for editor)
  2. Tap "Change Symbol" in editor panel
  3. Symbol Picker screen opens
  4. User searches/browses, selects symbol
  5. Returns to editor with new symbol applied
  6. Tap Done to save

Move a button:
  1. Long-press a button to start drag
  2. Drag to target position
  3. Buttons swap positions
  4. Release to drop
  5. Change saved immediately (no Done required for position)

Delete a button:
  1. Select button
  2. Tap "Delete Button" in editor panel
  3. Confirm dialog appears ("Delete 'pizza'?")
  4. Confirm → button removed, cell becomes empty
  5. Undo available for 25 steps
```

### 12.4 Vocabulary Search (v1.0 — simple version)

```
1. Tap 🔍 in the top bar → search field with on-screen keyboard
2. Case-insensitive substring match over button labels in the active
   page set (single SQL LIKE query)
3. Results list: button label + symbol + the page it lives on
4. Tap a result → navigate to that page; the button pulses briefly
5. Speaker icon on each result speaks the word without navigating
```

Answers the caregiver question "where is 'cookie'?" without leaving use
mode. The full requirements §4.10 version ("show me how to find it" path
highlighting) is deferred to v1.2.

### 12.5 Backup Reminder

The catastrophic failure mode for families is losing a customized
vocabulary (browser storage eviction, lost device). On app open, if the
vocabulary has changed since the last .obz export AND the last export is
more than 30 days old (or never happened), show a dismissible prompt in
edit mode / settings entry: "Your vocabulary has unsaved changes — back
up now?" One tap runs the export. Never interrupts use mode.

### 12.6 PWA Install Prompt (web)

Installing to the home screen matters twice: adoption (the app opens
full-screen like a native app) and storage — installed PWAs receive
stronger persistence guarantees, directly reducing vocabulary-loss
risk (§8).

- Chrome/Edge: listen for `beforeinstallprompt`; show an in-app
  "Install SayThrough" banner after onboarding completes (never during
  first use)
- iPad/iPhone Safari: no install API exists — show a one-time
  instruction sheet ("Share → Add to Home Screen") with images
- Re-offer from Settings → About at any time; if dismissed, don't
  re-prompt more than once every 14 days

---

## 13. Edit Mode Specification

### 13.1 PIN Protection

```typescript
// utils/pin.ts
//
// PINs here are child-proofing, not security: a 4-digit PIN has only
// 10,000 combinations, so no hash function makes it brute-force
// resistant. Salted SHA-256 via expo-crypto is sufficient, works on
// iOS/Android/web, and avoids a bcrypt dependency (bcrypt has no
// React Native support).
import * as Crypto from 'expo-crypto'

export function generatePinSalt(): string {
  return Crypto.randomUUID()
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`
  )
}

export async function verifyPin(
  pin: string,
  salt: string,
  hash: string
): Promise<boolean> {
  return (await hashPin(pin, salt)) === hash
}

// EditService.ts
import { verifyPin } from '../utils/pin'

export async function requestEditAccess(user: UserProfile): Promise<boolean> {
  if (!user.editPinHash || !user.editPinSalt) {
    // No PIN set — enter edit mode directly
    return true
  }

  // Show PIN entry modal — returns entered PIN or null if cancelled
  const pin = await showPinEntryModal()
  if (!pin) return false

  return verifyPin(pin, user.editPinSalt, user.editPinHash)
}
```

### 13.2 Undo/Redo

Every edit action is recorded as a reversible operation:

```typescript
type EditAction =
  | { type: 'ADD_BUTTON'; button: Button; pageId: string }
  | { type: 'DELETE_BUTTON'; button: Button; pageId: string }
  | { type: 'MOVE_BUTTON'; buttonId: string; fromPos: GridPos; toPos: GridPos }
  | { type: 'UPDATE_BUTTON'; buttonId: string; before: Partial<Button>; after: Partial<Button> }
  | { type: 'ADD_PAGE'; page: Page }
  | { type: 'DELETE_PAGE'; page: Page; buttons: Button[] }
  | { type: 'UPDATE_PAGE'; pageId: string; before: Partial<Page>; after: Partial<Page> }
```

Max undo stack depth: 50 actions.
Stack is cleared when exiting edit mode.

---

## 14. Interchange & Backup

### 14.1 Export (.obz)

```typescript
// services/OBFService.ts

export async function exportPageSet(pageSetId: string): Promise<string> {
  const pageSet = await db.getPageSet(pageSetId)
  const pages = await db.getPages(pageSetId)
  const allButtons = await db.getButtonsForPageSet(pageSetId)

  // Build OBF manifest
  const manifest = {
    format: 'open-board-0.1',
    root: `boards/${pageSet.rootPageId}.obf`,
    paths: {
      boards: {},
      images: {},
      sounds: {},
    }
  }

  // Build one .obf JSON per page
  for (const page of pages) {
    const buttons = allButtons.filter(b => b.pageId === page.id)
    const obf = buildOBFPage(page, buttons)
    // Add to zip at boards/{pageId}.obf
  }

  // Copy symbol images into images/ folder in zip
  // Write manifest.json
  // Return path to .obz file in FileSystem.documentDirectory/exports/
}
```

### 14.2 Import (.obz)

```typescript
export async function importPageSet(
  obzUri: string,
  userId: string
): Promise<string> {
  // Unzip to temp directory
  // Parse manifest.json
  // Parse each .obf board file
  // Create PageSet, Pages, Buttons in SQLite
  // Copy any embedded images to userSymbols/
  // Return new pageSetId
}
```

---

### 14.3 Full Device Backup (.json)

`.obz` is an *interchange* format: it carries a page set and nothing else. It
does not carry profiles, TTS voice, access-method tuning (dwell time, scan
speed, touch accommodations), the caregiver PIN, word lists, message history,
the learned prediction model, or tracking data.

That gap is a real risk rather than a missing nicety. The web build stores
everything in IndexedDB; `createStorage.web.ts` requests
`navigator.storage.persist()`, but persistence is best-effort, and a cleared
browser, a replaced device or a school reimaging a tablet loses the lot —
including access settings an SLP tuned in a therapy session. Every competitor
solves this with a cloud account. We solve it without one.

```typescript
// services/backupService.ts
interface BackupFile {
  format: 'saythrough-backup'
  version: number
  exportedAt: number
  data: {
    meta: Record<string, string>   // active profile, seed version,
                                   // per-profile history + prediction model
    users: UserProfile[]
    pageSets: PageSet[]
    pages: Page[]
    buttons: Button[]
    wordLists: WordList[]
    wordListItems: Array<{ wordListId: string; buttonId: string }>
    trackingEvents: TrackingEvent[]
  }
}

createBackup(storage): Promise<BackupFile>
parseBackup(text): BackupFile        // throws, with user-facing messages
restoreBackup(storage, backup): Promise<void>
```

Design notes:

- **A plain JSON file, not cloud sync.** It keeps the local-first, no-account
  promise while removing the "one wipe and it's gone" failure. Optional sync
  (Tier 4) can come later and reuse this shape.
- **`Storage.getAllMeta()` exists for this.** Everything else is reachable
  through the existing repository methods, but `meta` could only be read by
  key, and it holds the per-profile message history and prediction model.
- **Restore replaces; it does not merge.** Merging would have to invent
  answers for conflicting ids. Writes are ordered page sets → pages →
  buttons and word lists → items so the SQLite driver's foreign keys hold at
  every step, and the memoized prediction model is invalidated afterwards
  because a restore can put different data behind the same profile id.
- **Validation happens before the wipe.** `restoreBackup` destroys the device's
  data, so `parseBackup` rejects malformed, foreign or newer-versioned files
  first, and the UI describes the backup (date, profile names) and requires a
  second confirming tap before anything is written.
- **The file contains personal data** — PIN hash, tracking, history, learned
  words. It is never uploaded anywhere, and the UI says so.

---

## 15. MVP Scope

### In MVP (v1.0)

| Feature | Notes |
|---|---|
| Platform | Installable web PWA (react-native-web), deployed to free static hosting |
| Language | English only (v1.0) |
| Symbol grid display | Touch access only |
| Touch accommodations | Hold-to-activate, repeat-tap debounce, second-touch guard |
| ~16,500 symbols (13,500 ARASAAC + ~3,000 Mulberry) | Self-hosted same-origin lazy-load + Cache API; active page set pre-cached; optional full offline pack (~180 MB) |
| Skin-tone variants | Core-set person symbols in ARASAAC skin/hair variants; per-profile default (§9.4) |
| Core vocabulary page set | Persistent-core template, authored at 5×6 — design: §19 |
| Quick Phrases page set | 18-button single page — content plan: §19.4 |
| Message bar | Accumulate + Speak + Clear + Backspace + Copy/Share |
| Speak-on-select option | Per user setting |
| Page navigation | Linked buttons, back/home |
| Basic keyboard | QWERTY type-to-speak into the message bar; prediction arrives v1.1 (§18) |
| Vocabulary search | Top bar 🔍: find a word, jump to its page (§12.4) |
| Backup reminder | Prompt if no .obz export in 30 days with vocabulary changes (§12.5) |
| TTS via expo-speech | Platform native voices; local voices preferred; engine warm-up (§10.4) |
| Voice selection | Per-voice preview, rate, pitch, volume controls |
| Basic edit mode | Add, delete, move, edit buttons |
| Symbol picker | Local search from symbolIndex.json |
| Button editor | Label, symbol, color, basic actions |
| PIN-protected edit mode | Single 4-digit PIN per user |
| Multiple user profiles | Unlimited profiles per device |
| Settings screen | Voice, display, access basics |
| Per-profile layout prefs | Message bar top/bottom, toolbar items, button gap, label text scale |
| Vocabulary Filter | Word lists, toggle on/off |
| First-launch setup screen | Not needed on web; ZIP extraction with progress arrives with native builds (v1.1) |
| Onboarding | Name, avatar, starting vocabulary, caregiver PIN (skippable) |
| Try-it / guest mode | Zero-setup demo from the welcome screen; nothing persisted |
| PWA install prompt | beforeinstallprompt banner + Safari instruction sheet (§12.6) |
| Keep screen awake | Screen Wake Lock API on web; expo-keep-awake in native builds |
| Export .obz | Backup to Files / share |
| Import .obz | Restore from Files |
| Part-of-speech color coding | 7 colors, per-button override |
| Data tracking | Off by default (caregiver opt-in); button press logging, basic report |
| Haptic feedback | Vibration API where supported on web; full support arrives with native builds (v1.1) |

### Post-MVP (v1.1+)

| Feature | Phase |
|---|---|
| Native iOS + Android builds (EAS; bundled symbols.zip, first-launch extraction, haptics) | v1.1 |
| Switch scanning (all patterns) | v1.1 |
| Dwell selection | v1.1 |
| Auditory Touch access method | v1.1 |
| Word prediction on keyboard (design: §18) | v1.1 |
| Additional authored grid sizes of the Core set (3×4 simplified, 6×10 expanded) | v1.1 |
| Message history (re-speak recent; own table — independent of opt-in tracking) | v1.1 |
| Emergency quick-fire phrase | v1.1 |
| Word Forms / morphology | v1.1 |
| Visual schedules | v1.2 |
| Visual timer | v1.2 |
| Scripts | v1.2 |
| Whiteboard | v1.2 |
| Rating scales | v1.2 |
| Visual Scene Displays | v1.2 |
| Photo album | v1.2 |
| Partner window + chat mode | v1.2 |
| Full search path highlighting ("show me how to find it") | v1.2 |
| Cloud sync / backup | v2.0 |
| Team sharing (SLP ↔ parent) | v2.0 |
| Bilingual toggle (code-switching) | v2.0 |
| Advanced data reports + PDF export | v2.0 |
| SLP professional dashboard | v2.0 |
| Voice banking integration | v2.0 |
| Eye gaze hardware support | v3.0 |
| Community page set library | v3.0 |

---

## 16. Project File Structure

```
saythrough/
│
├── app.json                    ← Expo config (name, icons, permissions, etc.)
├── app.config.ts               ← Dynamic Expo config (env vars)
├── tsconfig.json
├── package.json
├── .env                        ← Environment variables (not committed)
│
├── assets/
│   ├── symbols.zip             ← 13,500 ARASAAC symbols (generated by scripts)
│   ├── symbolIndex.json        ← Symbol metadata/keywords (generated)
│   ├── symbol-placeholder.png  ← Shown while symbol loads
│   ├── icon.png                ← App icon
│   ├── splash.png              ← Splash screen
│   └── vocabulary/
│       ├── core-vocabulary.obf ← Bundled Core vocabulary page set
│       └── quick-phrases.obf   ← Bundled Quick Phrases page set
│
├── scripts/                    ← Dev-time scripts (not in app bundle)
│   ├── 1-downloadArasaacIndex.js
│   ├── 2-downloadSymbols.js
│   ├── 3-resizeSymbols.js
│   ├── 4-convertToWebp.js
│   ├── 5-buildZip.js
│   └── 6-buildSymbolIndex.js
│
├── src/
│   │
│   ├── screens/
│   │   ├── FirstLaunchScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── CommunicationScreen.tsx  ← PRIMARY SCREEN
│   │   ├── SettingsScreen.tsx
│   │   ├── DataTrackingScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── ImportExportScreen.tsx
│   │
│   ├── components/
│   │   ├── communication/
│   │   │   ├── SymbolButton.tsx      ← core interactive unit
│   │   │   ├── SymbolGrid.tsx        ← lays out buttons
│   │   │   ├── MessageBar.tsx        ← accumulated message + speak
│   │   │   ├── TopBar.tsx
│   │   │   └── Toolbar.tsx
│   │   ├── edit/
│   │   │   ├── ButtonEditorPanel.tsx
│   │   │   ├── PageEditorPanel.tsx
│   │   │   └── SymbolPicker.tsx
│   │   ├── settings/
│   │   │   ├── VoiceSettings.tsx
│   │   │   ├── AccessMethodSettings.tsx
│   │   │   └── VocabularyFilterSettings.tsx
│   │   └── common/
│   │       ├── PinEntryModal.tsx
│   │       ├── ProgressBar.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── stores/                  ← Zustand stores
│   │   ├── navigationStore.ts
│   │   ├── messageStore.ts
│   │   ├── userStore.ts
│   │   ├── editStore.ts
│   │   └── trackingStore.ts
│   │
│   ├── services/
│   │   ├── TTSService.ts
│   │   ├── SymbolService.ts
│   │   ├── StorageService.ts     ← SQLite operations
│   │   ├── TrackingService.ts
│   │   ├── OBFService.ts         ← import/export
│   │   ├── EditService.ts        ← PIN, undo/redo
│   │   └── PredictionService.ts  ← word prediction (v1.1, see §18)
│   │
│   ├── db/
│   │   ├── database.ts           ← SQLite connection and migrations
│   │   ├── schema.ts             ← Table definitions
│   │   └── queries/
│   │       ├── users.ts
│   │       ├── pageSets.ts
│   │       ├── pages.ts
│   │       ├── buttons.ts
│   │       └── tracking.ts
│   │
│   ├── constants/
│   │   ├── colors.ts             ← Part-of-speech color palette
│   │   ├── storage.ts            ← AsyncStorage key constants
│   │   ├── defaults.ts           ← Default grid sizes, TTS settings
│   │   └── layout.ts             ← Bar heights, spacing, breakpoints
│   │
│   ├── types/
│   │   ├── models.ts             ← All TypeScript interfaces (from Section 4)
│   │   ├── navigation.ts         ← React Navigation type params
│   │   └── obf.ts                ← Open Board Format types
│   │
│   ├── hooks/
│   │   ├── useSymbol.ts          ← Resolves symbol URI for a button
│   │   ├── usePageButtons.ts     ← Loads buttons for current page
│   │   ├── useEditMode.ts        ← Edit mode state and PIN logic
│   │   └── useTracking.ts        ← Tracking event helpers
│   │
│   └── utils/
│       ├── uuid.ts
│       ├── pin.ts                ← PIN hashing (expo-crypto, salted SHA-256)
│       ├── gridLayout.ts         ← Button size calculations
│       └── obfMapper.ts          ← Map OBF format ↔ internal models
│
└── tests/
    ├── unit/                      ← Jest (jest-expo preset)
    │   ├── TTSService.test.ts
    │   ├── OBFService.test.ts
    │   └── gridLayout.test.ts
    ├── component/                 ← Jest + React Native Testing Library
    │   ├── SymbolButton.test.tsx
    │   ├── MessageBar.test.tsx
    │   └── SymbolGrid.test.tsx
    └── e2e/                       ← Playwright, run against the web build
        ├── communication.spec.ts  ← Core tap → speak flow
        └── editMode.spec.ts
        (first-launch extraction E2E arrives with the native builds
         in Phase 2, via Maestro)
```

---

## 17. Accessibility

Baseline: WCAG 2.1 AA for all UI chrome (aac-requirements.txt §3.3).
Accessibility here is not just compliance — keyboard operability is the
foundation that switch scanning (v1.1) builds on.

### 17.1 Semantics & Screen Readers

- Every interactive element gets `accessibilityRole` and `accessibilityLabel`
  (react-native-web maps these to ARIA roles/attributes on the web build):
  - SymbolButton: role `button`, label = button label; navigation buttons
    append ", opens {page name}"
  - Message bar: live region (`accessibilityLiveRegion="polite"` /
    `aria-live="polite"`) so added words are announced without moving focus
  - Top bar / toolbar controls: explicit labels ("Speak message",
    "Clear message", "Delete last word", "Back", "Home", "Search")
- The app must remain fully operable with VoiceOver/TalkBack running, but is
  not designed around them — most AAC users select directly. Test that screen
  reader focus does not fight direct touch selection.

### 17.2 Keyboard & Switch Operability (web)

- Full keyboard operability: Tab / arrow keys traverse the grid in reading
  order; Enter/Space activates. This doubles as the entry point for switch
  access, since most switch interfaces emulate keyboard keys.
- Visible focus indicator (≥ 2px outline) on every focusable element; never
  remove the outline without a replacement.
- No keyboard traps. Modals (PIN entry, button editor) trap focus while open
  and restore it to the invoking element on close.

### 17.3 Visual

- Touch targets ≥ 44×44pt for all controls, including top bar and toolbar
  icons (grid buttons already have a 60×60pt minimum).
- Text contrast ≥ 4.5:1. Part-of-speech background colors are supplementary —
  meaning is never conveyed by color alone (symbol + label always present).
- High-contrast variant (dark background, high-contrast symbols) per
  requirements PS-01 — Phase 3 roadmap.
- Grid text scales via the `uiScale` setting rather than unconstrained OS
  font scaling, so button layout stays motor-plan stable; settings screens
  respect system font scaling normally.

### 17.4 Motion & Timing

- `animationsEnabled` per-user setting; the web build also honors
  `prefers-reduced-motion` as the default for new profiles.
- No time-limited interactions in use mode; all timing (touch acceptance
  delay, dwell time, scan speed) is user-configurable.

---

## 18. Word Prediction (v1.1)

Design for the offline prediction engine required by aac-requirements.txt §4.5.
Ships with the keyboard work in v1.1, but is documented now because the asset
pipeline and schema-migration decisions affect scaffolding.

### 18.1 Requirements Recap

- Word completion (prefix match) + next-word prediction (context-based)
- Learns from the user's own messages; learning resettable independently
- Fully offline; per-profile, per-language model
- Abbreviation expansion (user-defined shorthand → full phrase)

### 18.2 Architecture — Two-Layer Model

**Layer 1 — Base lexicon (shipped asset, read-only).** Built by
`scripts/prediction/` from [FrequencyWords](https://github.com/hermitdave/FrequencyWords)
(OpenSubtitles-derived; generator MIT, **lists CC BY-SA 4.0**, so our derived
lists stay CC BY-SA and are attributed in the root README):

- `public/prediction/{lang}.txt` — top 30,000 words, one per line, most
  frequent first, **no counts and no header**
- ~237 KB raw / ~114 KB gzipped per language; committed to the repo
- Fetched lazily on first keyboard open, then held in module memory; the
  service worker's stale-while-revalidate rule caches it offline (no precache
  entry, matching `symbolIndex.json`)

Three decisions here replaced the original sketch, which called for 150k
unigrams plus pruned bigrams and trigrams in a 3–5 MB gzipped bundle:

1. **Order is the only frequency signal, so counts are not shipped.** The
   engine scans from the top and stops at the first K prefix matches, which
   are by definition the K most frequent matches. Storing ranks alongside
   would double the asset to feed a column nothing reads. This also replaces
   the binary-search-over-sorted-lexicon plan in §18.3 — a linear scan with
   early exit is simpler, needs no counts, and returns candidates
   pre-ranked.
2. **30k words, not 150k.** Measured against the corpus, 10k drops
   *broccoli*, *giraffe*, *inhaler*, *trampoline* (ranks 11k–21k) — the
   concrete nouns the keyboard exists to reach, since anything commoner is
   already on a button. Past 30k the tail is film proper nouns. A 3–5 MB
   download is also a poor trade for a PWA that must install over school
   wi-fi.
3. **No shipped bigram/trigram tables in v1.** They are where the size
   actually explodes, and the licensing on raw corpora is murkier than on
   derived frequency lists. Next-word prediction comes from the personal
   model plus a small seeded frame list; a real bigram asset can land later
   without changing the engine's interface.

Raw subtitle data cannot be shipped as-is — profanity ranks near the top
(`shit` 285th, `fuck` 299th), contractions are tokenized apart (no `don't`
anywhere; the orphaned stem `don` ranks 31st), and the list carries clitics
and stutter debris. `scripts/prediction/README.md` documents the filtering,
the exact-match-only blocklist rule, and the clinical/protective vocabulary
that is deliberately kept and force-restored.

**Layer 2 — Personal model (per profile).** Unigram + bigram counts updated
when a message is **spoken** — NOT on every keystroke (words typed and then
deleted must not train the model), and never while modeling mode is active
(`TrackingEvent.isModeling`): an SLP demonstrating on the device must not
train the user's model.

Stored as a per-profile JSON blob in the `meta` table, following the
`services/messageHistory.ts` precedent, rather than the dedicated
`prediction_ngrams` table originally specced:

```typescript
// meta key: `prediction:${userId}`
interface PersonalModel {
  unigrams: Record<string, number>
  bigrams: Record<string, Record<string, number>>   // head → next → count
}
```

The model is capped (~500 unigrams / ~1000 bigram heads) and aged by halving
all counts when it exceeds the cap, so the blob stays a few KB and a rewrite
per spoken message is cheaper than the two storage-driver implementations
plus schema migration a table would need — `createStorage.ts` is SQLite but
`createStorage.web.ts` is IndexedDB, so a table is not one piece of work. If
the model outgrows the blob, promote it to a table then; the engine only sees
the `PersonalModel` shape.

Abbreviation expansion (requirements §4.5) is **deferred**; the `Prediction`
union below already reserves its source tag so adding it later does not
change the engine's interface.

### 18.3 Scoring & API

```typescript
// services/prediction.ts
interface Prediction {
  word: string
  source: 'abbreviation' | 'personal' | 'vocabulary' | 'base'
}

predict(prefix: string, previousWord: string | undefined, limit = 4): Prediction[]
learnFromMessage(userId: string, words: string[]): void
resetLearning(userId: string): void   // clears the personal model ONLY
```

Four ranked sources are merged, each normalized to 0–1 and combined with
named constant weights (kept pure, so `tests/unit/prediction.test.ts` covers
the ranking without touching storage or the network):

| Source | Weight | Notes |
|---|---|---|
| Personal bigram (given previous word) | highest | what this user actually says next |
| Personal unigram | high | this user's own words |
| The user's own button labels | medium | a profile with a "grandma" button must beat corpus `gra…` |
| Base lexicon rank | low | `1 − log(index+1)/log(N+1)`, Zipf-shaped |

The vocabulary source matters more than its weight suggests: prediction
driven purely by a generic corpus feels wrong to AAC users, because the words
they most want are the ones already meaningful in their own page set.

With an empty personal model the blend collapses to plain corpus frequency,
which is the correct cold-start behavior.

**Early exit and correctness.** Personal and vocabulary candidates are small
sets and are scanned in full, so capping the lexicon scan cannot hide a
high-scoring personal word. The scan collects up to `limit × 5` matches to
leave the blend room to reorder.

### 18.4 Performance & Privacy

- A prefix lookup is one linear scan over a 30k-element array with early exit
  — sub-millisecond in practice, and typing rate is the real bound. No web
  worker, and no binary search, unless profiling proves otherwise.
- The personal model never leaves the device: excluded from .obz exports and
  from future cloud sync unless the user explicitly includes it in a full
  backup. Deleted when the profile is deleted, and clearable on its own from
  Settings ("Clear learned words") without touching tracking data.
- Learning is **not** consent-gated. It is a communication convenience rather
  than analytics — the same reasoning `services/messageHistory.ts` already
  applies to recents and favorites — so it is on by default, disclosed, and
  independently clearable. Data tracking (§4.13) stays opt-in as before.

---

## 19. Core Vocabulary Page Set Design (v1.0)

The bundled page set IS the product for the end user: the code determines
whether the app works; this page set determines whether a child can talk.
It gets designed with the same rigor as any subsystem.

### 19.1 Design Principles

1. **Core words never move.** A persistent core region is identical in
   position and content on every page of the set (motor planning —
   requirements PS-01: "core words always accessible from every page").
2. **≤ 2 selections to any word** (home → topic page → word).
3. **Fitzgerald color coding** (§5.3 palette) applied consistently.
4. **Adapt, don't invent.** Base word selection on established, openly
   licensed core vocabularies — Project Core's Universal Core, AAC
   Language Lab core lists, Cboard's CC-licensed boards — and get a
   practicing SLP's review before release.

### 19.2 Page Templates — One Authored Layout Per Size

A motor-plan layout **cannot be reflowed**: changing the grid moves every
word, which destroys the automaticity the persistent core region exists to
protect. So grid size is not a resize control. Each size is authored
separately in `src/data/coreWords.json` under `sizes`, becomes its own page
set, and is chosen once at setup.

Shipped sizes:

| Key | Grid | Core region | Set id |
|---|---|---|---|
| `5x6` | 5 × 6 | 3 columns (15 words) | `builtin-core-vocabulary` |
| `3x4` | 3 × 4 | 2 columns (6 words) | `builtin-core-3x4` |
| `6x10` | 6 × 10 | 4 columns (24 words) | `builtin-core-6x10` |

Word counts: 3×4 ships 26 words, 5×6 ships 203, 6×10 ships **307**. The core
region is the reason the sizes exist — 6 / 15 / 24 core words is a ceiling no
amount of content authoring can lift within a given grid, since the region is
`rows × coreColumns` cells and is full at every size.

`5x6` predates multi-size support and **keeps the exact ids it shipped
with** — profiles, word lists and user-created pages all reference them.
Only non-default sizes take a `builtin-core-{size}-…` prefix. Button ids
derive from their page id (`{pageId}-r{row}-c{column}`), so they stay stable
automatically.

`buildSet(size, now)` in `seedCoreVocabulary.ts` is the single source of
truth: seeding and the level map both derive from it, so the two cannot
drift. A 6×10 expanded variant is content work, not machinery — adding it is
a new entry in `coreWords.json`.

Consequence for navigation: the toolbar's "Core" returns to the user's
**active** page set, not a meta-recorded default, or a user of one grid size
would be thrown onto another layout.

```
┌────────┬────────┬────────┬────────┬────────┬────────┐
│  CORE  │  CORE  │  CORE  │  page  │  page  │  page  │
│  CORE  │  CORE  │  CORE  │  page  │  page  │  page  │
│  CORE  │  CORE  │  CORE  │  page  │  page  │  page  │
│  CORE  │  CORE  │  CORE  │  page  │  page  │  page  │
│  CORE  │  CORE  │  CORE  │  page  │  page  │  page  │
└────────┴────────┴────────┴────────┴────────┴────────┘
```

- Columns 1–3 (15 cells): persistent core words — identical on every page
- Columns 4–6 (15 cells): page-specific content — topic-navigation buttons
  on the home page; topic (fringe) words on topic pages, with an optional
  "more ➜" button linking to a second page of that topic

### 19.3 Vocabulary Levels

Levels answer "how much of the board is introduced yet" **without** violating
§19.1. Every word is authored at its final position and tagged with the level
that introduces it (`[label, partOfSpeech, level]`); a lower level hides the
rest. Raising a user's level only un-hides cells — nothing already learned
ever moves. That is what makes a grow-with-me path compatible with "core
words never move", and it is why levels are safe to change at any time while
grid size is not.

- **Core is level 1 at every size.** Core words are the highest-value words
  on the board and the reason the persistent region exists; levels tier the
  fringe around them.
- **Back is level 1**, always — it is the way off a topic page.
- **A word is no more reachable than its topic page**, so a word's effective
  level is `max(word, topicPage)`.
- `UserProfile.vocabularyLevel` is `1 | 2 | 3` and **undefined means 3**:
  profiles created before levels existed must not silently lose words.
- Implementation reuses the existing `isHidden` seam rather than adding a
  filter of its own — `CommunicationScreen` marks out-of-level buttons hidden
  at render time, so they drop out of the grid, the scan model and search
  together, stay visible in edit mode, and nothing is written to storage.
- The Settings control is hidden for a page set that defines only one level
  (`levelCountForPageSet`), so the simplified board shows no dead choice.

Distinct from the Vocabulary Filter (§4.8), which deliberately *dims* rather
than hides so a partner can still model. Levels hide: 200 greyed-out buttons
is exactly the overwhelm a Basic level exists to prevent.

### 19.4 Content Plan

**Shipped at 5×6 (203 words):** 15 core + 188 fringe across 14 topic pages —
inside the ~200–250 target below. Two rules the generator enforces rather than
trusting to whoever edits the word lists:

- **Every core-board page keeps a free cell.** A board filled to 100% cannot
  have the child's own words added to it, and personalisation — family names,
  a favourite food — is central to AAC rather than an afterthought. Quick
  Phrases (§19.5) is the exception: 18 phrases on 3×6, full by design.
- **A topic that outgrows its page overflows** onto a "More" page in the final
  content cell (a fixed position, so it does not move as a topic grows) rather
  than losing words off the grid. Before this, the 15th Actions word ("turn
  off") was silently dropped by the row filter and never became a button.

Page ids derive from topic labels, so a topic named "Home" would collide with
the home page itself. `buildSet` throws on duplicate page ids; the household
topic is called "House" for this reason. Weather is not in the plan below and
was dropped to keep the home page to one screen with headroom — it returns on
the 6×10 board, which has far more navigation room.

**Original plan:**

- **Persistent core (15 words, candidate list pending SLP validation):**
  I, you, it, want, go, like, help, more, stop, not, do, feel, look,
  yes, no
- **Home page:** core region + 15 topic-navigation buttons (Food, Drinks,
  Play, People, Feelings, Places, School, Home, Body, Actions,
  Describing, Social, Animals, Clothing, More…)
- **Topic pages:** 10–14 pages × ~15 fringe words ≈ 150–210 topic words
- **Total:** ~200–250 buttons; every label must have a bundled core
  symbol — the ~200 bundled symbols (§3) are exactly this set

### 19.5 Quick Phrases Page Set

18-button single page (3×6), each speaking a full sentence in one tap:
greetings (3), requests (4), social (4), comments (3), conversational
repair — "That's not what I meant", "Something else" (2), and
attention/emergency (2).

### 19.6 Acceptance Criteria (release gate for v1.0)

- From ANY page, a user can produce "help", "stop", "more", "I want ___",
  and "I feel ___" in ≤ 2 selections
- The core region is identical (labels + positions) across all pages of
  every authored size — asserted per size in `tests/unit/vocabulary.test.ts`,
  alongside checks that no button lands off-grid or shares a cell, and that
  raising a level never moves a button
- A practicing SLP has reviewed the word selection and layout, and the
  sign-off is documented in the repo

---

*Document maintained alongside the codebase. Update this spec before
implementing any major feature change.*
