# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**SayThrough** — a free, open-source alternative to TD Snap and other expensive AAC (Augmentative and Alternative Communication) software. Targets teachers, parents, and SLPs who cannot afford $9.99/month commercial solutions.

See `docs/aac-requirements.txt` for the full feature requirements document derived from deep research into TD Snap, Proloquo2Go, and the broader AAC landscape, and `docs/technical-specification.md` for the technical spec (data models, screens, §19 core page set design). Update the spec before implementing any major feature change. `docs/competitive-backlog.md` is the prioritized, status-tracked UX & feature backlog vs. competitors — keep its checkboxes current as items ship.

## Architecture (Planned)

- **Web-first, one codebase**: React Native + Expo; Phase 1 ships an installable web PWA (react-native-web) to free static hosting, Phase 2 ships the same codebase as native iOS/Android apps via EAS Build
- **Local-first**: All data in SQLite (expo-sqlite; IndexedDB-backed on web); cloud sync is optional and never required
- **Symbols**: Web (Phase 1) lazy-loads ARASAAC + Mulberry (~16,500 symbols, namespaced refs like `arasaac:2788`) from self-hosted same-origin static assets (school-filter safe, no third-party requests) with Cache API caching, pre-caches the active page set, and offers an optional full offline pack (~180 MB); native builds (Phase 2) bundle `symbols.zip`, extracted on first launch to `FileSystem.documentDirectory/symbols/`
- **Open standards**: Native Open Board Format (.obf/.obz) import/export for interoperability
- **Multilingual**: English, Spanish, Polish. One authored page set per (language, size) — a board is never machine-translated or reflowed. UI strings in `src/i18n` (`en.ts` canonical; other tables are typed so a missing key fails the build). Prediction lexicon, next-word frames, voice ranking and the Piper model all follow the profile's language. Each language has its own morphology engine (`morphology.{es,pl}.ts`) — Spanish needs gender agreement, Polish needs case and the speaker's own grammatical gender. See technical-specification.md §19.7
- **Symbol libraries**: ARASAAC (CC BY-NC-SA) + Mulberry (CC BY-SA) — no proprietary PCS/Boardmaker dependency
- **TTS**: `expo-speech` (AVSpeechSynthesizer on iOS, Android TTS engine)

## Key Domain Concepts

- **Page set**: A tree of linked grid pages forming a complete vocabulary system (Core First, Motor Plan, Express, Text, Scanning, Aphasia)
- **Button**: The fundamental interactive unit — has a symbol, text label, and one or more actions
- **Message bar**: Accumulates tapped words before speaking; can also speak-on-select
- **Access method**: How the user physically interacts (touch, switch scanning, dwell, eye gaze)
- **Vocabulary Filter**: Clinical tool for SLPs to limit which words are visible during therapy
- **Core words**: ~200–500 high-frequency words that account for ~80% of daily speech

## Tech Stack (Target)

- React Native + Expo SDK 52+ + TypeScript 5.x
- Zustand (state management — 5 stores: navigation, message, user, edit, tracking)
- expo-sqlite (local relational storage)
- expo-speech (TTS — Web Speech API on web), expo-audio (recorded button audio — NOT deprecated expo-av), expo-crypto (PIN hashing — NOT bcrypt), expo-file-system, expo-image, expo-asset
- react-native-zip-archive (first-launch symbol extraction — native builds only, Phase 2)
- react-navigation (routing)
- EAS Build / EAS Submit (App Store deployment — Phase 2)
- Jest (jest-expo preset) + React Native Testing Library (unit/component tests), Playwright (E2E against the web build)

## Commands

```
npm install        # install dependencies
npm run web        # Expo dev server, web target
npm start          # Expo dev server (choose platform)
npm run build      # production web export → dist/ (+ PWA postbuild)
npm run typecheck  # tsc --noEmit (app only; tests excluded)
npm test           # jest unit tests (pure logic; tests/unit)
npm run e2e        # build + Playwright E2E against the web build (tests/e2e)
npm run lexicon    # rebuild prediction lexicons (en + es) from OpenSubtitles
npm run spanish-core  # regenerate the Spanish boards + symbol map
npm run polish-core   # regenerate the Polish boards + symbol map
npm run review-packet # regenerate docs/slp-review*.md (one per language)
npm run voice      # fetch the English Piper model (voice:es, voice:pl too)
```

Tests: unit via jest + ts-jest (`tests/unit`); end-to-end via Playwright
against the exported build served by `scripts/serve-dist.mjs`
(`tests/e2e`). CI (`.github/workflows/ci.yml`) runs typecheck → unit →
build → E2E on every push and PR. Component tests via jest-expo + RNTL
are a planned follow-up.

## Usage counting

SayThrough reports to the **Presence** service (`dashboard.3583bytes.com`,
separate repo) as `SayThrough Site` and `SayThrough App`. It cannot self-host
this: saythrough.com is GitHub Pages, which is static and returns 405 to any
POST. Clients are `site/analytics.js` and `src/services/usageCounter.ts`; both
send a **random session id that is never persisted**, honour DNT/GPC, and share
the `saythrough-usage-counting` opt-out surfaced in Settings → Privacy.
Nothing anyone says or types is ever sent. Counts undercount on school
networks that block unlisted domains — accepted knowingly.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml` → GitHub Pages at the custom domain **saythrough.com**. The build (`npm run build`) produces a combined `dist/`:
- **`/`** — the hand-authored static marketing site + guides (source in `site/`, copied by `scripts/build-site.mjs`; each page is real crawlable HTML with its own SEO/OG tags).
- **`/app/`** — the Expo web app (exported with `EXPO_BASE_URL=/app` so it's a self-contained PWA under that path; `postbuild-web.mjs` handles its manifest/SW and marks it `noindex`).

`CNAME`, `robots.txt`, `sitemap.xml`, `og-image.png` live at the `dist/` root (from `site/`, not `public/`). The OG share image is generated from `scripts/og-image.html` via `npm run og-image`.
