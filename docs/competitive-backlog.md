# SayThrough — Competitive UX & Feature Backlog

**Purpose.** A prioritized, tracked backlog derived from a UX + feature
comparison against the major AAC apps. Companion to
`aac-requirements.txt` (the requirements) and `technical-specification.md`
(the build spec). Update the checkboxes as items ship.

**Last reviewed:** 2026-08-13
**Benchmarked against:** TD Snap (Tobii Dynavox), Proloquo2Go / Proloquo
(AssistiveWare), LAMP Words for Life & TouchChat (PRC-Saltillo), Speak for
Yourself, CoughDrop, and the open-source field (Cboard, AsTeRICS Grid).

**Legend.** Effort: **S** ≈ hours · **M** ≈ a few days · **L** ≈ a week+.
Status: `[x]` shipped · `[~]` partial / data-ready · `[ ]` not started.

---

## 0. Shipped recently (so the backlog reflects reality)

- [x] **Word prediction (§18)** — 30k-word offline lexicon (filtered from
  OpenSubtitles frequency data) blended with a per-profile model that learns
  from spoken messages, plus the user's own button labels, plus seeded AAC
  frames for next-word. Learning is on-device, excluded from modeling, and
  clearable on its own in Settings.
- [x] **Keyboard can write real sentences** — the apostrophe key (no "I'm" or
  "don't" without it), end punctuation that attaches to the previous word, and
  a digits/symbols mode that leaves the letter layout fixed.
- [x] **The keyboard is scannable** — switch users could not type at all
  before; the prediction bar and each key row are scan groups, and prediction
  saves the most keystrokes for exactly the slowest access methods.
- [x] **Access methods ahead of roadmap** — dwell (hover-to-select) + switch
  scanning (row-column/linear, auto/step) already in, though the roadmap
  files them under Phase 2.
- [x] **Themes / dark mode** (per-profile + system).
- [x] **Sentence bar rework** — one delete button (⌫); clear-all moved into
  the ⋯ actions sheet; tap the strip or a word to speak; long-press a word
  to remove just it.
- [x] **In-grid Back button** — a real seeded button at a fixed cell, so
  page-to-page navigation lives *in the vocabulary* (like TD Snap/Proloquo)
  and never shifts between edit and use mode (§19.5 motor-plan invariant).
- [x] **Post-speak options** (per-profile, default off) — "return to home
  after speaking" and "clear message after speaking".
- [x] **Attention bell** — one-tap chime to get a partner's attention
  (TD Snap's "alert bell"). Web Audio for now; native sound is a Phase-2 TODO.
- [x] **Emergency quick-fire phrase** — configurable one-tap urgent message.
- [x] **Message history** — per-profile recents + starred favorites;
  re-load a phrase into the bar to say it again (Proloquo2Go/TD Snap parity).

---

## 1. Where we stand

**Already ahead / at parity:** zero-friction guest mode (no competitor
lets you talk in 5s with no signup), persistent core region + Fitzgerald
color coding, in-grid navigation, dwell + switch scanning, OBF/OBZ
interoperability, offline PWA, multi-profile.

**The gaps that make us look incomplete** (Tier 1 below) and **the bets
that make us clearly better** (Tier 2) are where the backlog focuses.

---

## 2. Prioritized backlog

### Tier 1 — Table stakes (competitors have these; we look incomplete without)

| Item | Why it matters (who has it) | Effort | Status |
|---|---|---|---|
| **Word prediction** (offline n-gram) in the keyboard | Every major app; makes the text/literacy path usable | M | [x] |
| **Word forms / grammar** (long-press → plural, tense, possessive) | Proloquo, Grid 3; separates "toddler board" from real language | M–L | [x] |
| **Grid size + vocabulary level** at setup | All of them; model already stores per-page `rows`/`columns` — needs UI + starter templates | M | [~] |
| **Message history / favorites** | Proloquo2Go, TD Snap | S | [x] |
| **Word-by-word highlight while speaking** | TD Snap/Proloquo; literacy support | M | [x] |

### Tier 2 — Differentiators (make us *better*, lean into free + open)

| Item | Why it wins | Effort | Status |
|---|---|---|---|
| **Natural neural TTS (Piper)** | Kills the robot-voice problem for good; competitors *charge* for premium voices. Piper already validated at 0.8×. Needs a pluggable TTS backend + self-hosted model assets | L (~1–2 wk) | [ ] |
| **Spanish core set → multilingual** | ARASAAC symbols are already localized in 10+ languages (differentiator D-05); TouchChat/LAMP charge per language. Huge underserved reach | M | [ ] |
| **Printable companion boards (PDF)** | Backup when the device dies; free classroom copies (D-10). Trivial on web via print-to-PDF; genuinely unique | M | [ ] |
| **Recorded button audio** ("Mom's voice" / own voice) | TD Snap's *paid* My-Own-Voice. Model fields `audioUri`/`audioCueUri` already exist — just needs an `expo-audio` record UI | S–M | [~] |

### Tier 3 — Open new user segments

| Item | Who it reaches (who has it) | Effort | Status |
|---|---|---|---|
| **Visual Scene Displays (VSD)** | Emergent communicators + aphasia/stroke; tap hotspots on a photo (TD Snap, TouchChat, CoughDrop) | M–L | [ ] |
| **Visual supports** (schedule, timer, first-then, choice board) | Autism classrooms; strong teacher-market pull (TD Snap "Visual Supports") | M | [ ] |
| **Attention bell** | Getting a partner's attention (TD Snap alert bell) | S | [x] |
| **Emergency quick-fire phrase** | One-tap "I need help" | S | [x] |

### Tier 4 — Clinical moat (free where TD Snap charges pros — D-07)

| Item | Why | Effort | Status |
|---|---|---|---|
| **Optional cloud sync + team sharing** (SLP ↔ parent ↔ teacher) | CoughDrop's core selling point; unlocks multi-device. Stay local-first/private by default, sync opt-in | L | [ ] |
| **SLP dashboard** (multi-student, IEP goal tracking) | Paid elsewhere; therapists are the buyers/recommenders | L | [ ] |
| **Cloud data-tracking reports** | Extends the local, consent-gated tracking already built | M | [ ] |

---

## 3. UX micro-interactions (status)

- [x] Tap the sentence strip / a word to speak
- [x] Long-press a word in the bar to remove it
- [x] Return-to-home after speaking (optional)
- [x] Clear-after-speaking (optional)
- [x] In-grid, motor-plan-safe Back button
- [x] Word-by-word highlight during playback
- [x] Word forms (long-press a word → pick an inflection)
- [ ] Tap-and-hold a button to preview its word without adding it (modeling)
- [ ] Undo toast after destructive actions in use mode

---

## 4. Recommended sequence

1. **Quick wins remaining:** grid-size / vocabulary-level at onboarding →
   recorded button audio (data-ready).
2. **The flagship bet:** **Piper natural TTS.** Highest strategic
   leverage — permanently ends the robot-voice problem *and* becomes a
   free-premium-voice headline no competitor matches. De-risked (already
   validated); first step is a pluggable TTS backend + graceful fallback.
3. **Reach expander:** **Spanish core set** — biggest new-user unlock for
   the effort; proves the "free, multilingual, open" thesis.
4. **Then:** VSD → cloud sync / SLP tools.

---

## Appendix — competitor one-liners

- **TD Snap** ($9.99/mo): iPad-first; Core First/Motor Plan/Express/Text/
  Scanning/Aphasia; PCS symbols (proprietary); Acapela voices + My-Own-Voice;
  cloud tracking. Our answer: free, open symbols, OBF, transparent privacy.
- **Proloquo2Go / Proloquo** ($249 one-time): gold-standard symbol AAC;
  strong motor planning; 100+ voices; iOS-only. Our answer: cross-platform,
  free, motor-plan parity via the persistent core region.
- **LAMP / Speak for Yourself** ($149–299): motor-planning/automaticity —
  "a word never moves." We honor the same invariant (§19.5).
- **CoughDrop** ($9/mo or $295): web + cross-platform; cloud team sharing;
  strong reporting; supports OBF. Our answer: local-first + *optional* free
  sync, no subscription.
- **Cboard / AsTeRICS Grid** (open source): closest free peers; we aim past
  them on access methods, motor planning, and (with Piper) voice quality.
