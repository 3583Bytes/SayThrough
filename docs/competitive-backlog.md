# SayThrough — Competitive UX & Feature Backlog

**Purpose.** A prioritized, tracked backlog derived from a UX + feature
comparison against the major AAC apps. Companion to
`aac-requirements.txt` (the requirements) and `technical-specification.md`
(the build spec). Update the checkboxes as items ship.

**Last reviewed:** 2026-08-28
**Benchmarked against:** TD Snap (Tobii Dynavox), Proloquo2Go / Proloquo
(AssistiveWare), LAMP Words for Life & TouchChat (PRC-Saltillo), Speak for
Yourself, CoughDrop, and the open-source field (Cboard, AsTeRICS Grid).

**Legend.** Effort: **S** ≈ hours · **M** ≈ a few days · **L** ≈ a week+.
Status: `[x]` shipped · `[~]` partial / data-ready · `[ ]` not started.

---

## 0. Shipped recently (so the backlog reflects reality)

- [x] **Spanish — the whole stack, not a translation layer (§19.7)** — the
  gap where *every* competitor, free ones included, beat us. Shipped as: an
  i18n layer (`src/i18n`, English canonical and other tables typed so a
  missing key fails the build); **three authored Spanish boards** at the same
  sizes as the English ones (26 / 197 / 513 words, 14 / 106 / 310 core);
  a **Spanish morphology engine**; a 30k Spanish prediction lexicon with its
  own blocklist; Spanish next-word frames; Spanish voice ranking; and a
  Spanish Piper model fetched at deploy alongside the English one.
  Three things are worth calling out because they are why this could not be a
  translation pass:
  **(1) Two copulas.** `ser` and `estar` are both core and not
  interchangeable, so both are in the persistent core and *Palabras de apoyo*
  carries their person forms — the same hole the English "to be" audit found,
  doubled.
  **(2) Pro-drop.** Person lives on the verb, so the word-forms popup offers
  `como / comes / come / comemos / comen`, not tense alone. The frame words
  (`quiero`, `tengo`, `necesito`, `gusta`) ship already conjugated.
  **(3) Agreement.** A Spanish adjective's correct form depends on the noun
  already in the message bar, so `wordForms()` now takes the bar as context
  and offers the agreeing form first — inflection stopped being a property of
  one button and became a property of the sentence. Gender is inferred from
  the ending with an exceptions table (`la mano`, `el día`, `el agua`).
  Switching language keeps the user's **grid size**, pages, word lists and
  history. **Remaining: the §19.6 SLP sign-off, which is now needed per
  language** — a Spanish board reviewed by an English-speaking clinician is
  not a review.

- [x] **Clinical review pass on the vocabulary (§19.4)** — applied core
  vocabulary research (Banajee et al. 2003 toddler core) rather than waiting
  for the §19.6 sign-off, which is still outstanding. Three findings fixed:
  the **3×4 board was built backwards** for emergent communicators (6 core
  words against 20 topic nouns; now 14 core, and toddler-core coverage 6→9 of
  24); **"Basic" was not a beginner's level** (163 words on 6×10, assigned by
  mechanical thirds — now 52 words across 14 pages, with levels controlling
  page count and page density independently); and three words carried
  **different Fitzgerald colours on different pages** (`wait`, `again`,
  `together` — `back` left alone, since a body back and going back are
  different words). `npm run review-packet` regenerates `docs/slp-review.md`
  for the clinician who still has to sign this off.
- [x] **The verb "to be", auxiliaries and pronouns (§19.4)** — found by a user
  searching for "am" and getting nothing. **No form of "to be" existed on any
  board** — not am, is, are, was, were, be — nor most auxiliaries (can, will,
  would, did, does, has, had) or half the pronouns (he, she, we, they). An
  audit against published core lists found **32 high-frequency words absent**.
  Without them the board only produces telegraphic speech: "I hungry", never
  "I am hungry". Added a **Helping Words** page (copula, auxiliaries,
  contractions) at every size and a **Pronouns** page at 6×10; articles a/the
  replaced the two least useful Little Words in place. 6×10 is now **515
  words, 312 of them core**. The 5×6 board gave up Animals for it — sentence
  building beats topic breadth on a 14-slot board.
- [x] **Core vocabulary depth (§19.4)** — the expanded board now carries **247
  core words** (24 persistent + 8 core pages), inside the 200–400 research
  target, and **450 words total**. Added the grammatical categories that were
  missing entirely: Questions, Little Words, Time, Quantity. Words are ordered
  by utility and levelled by position, so a Basic learner gets the most
  powerful third of every page.
  The standard 5×6 board **prioritises rather than overflows**: it has 14
  navigation slots, so it takes Questions and Little Words and drops Clothes
  and House (both still on 6×10). Question words and prepositions are used in
  every sentence; scarves are not — and spilling topics onto a second home page
  would have put those words three selections away, breaking §19.1's
  ≤2-selections rule.
- [x] **Core pages split from topic pages (§19.4)** — core vocabulary pages
  (Actions, Describing, Feelings, Social) now sort ahead of fringe topics on
  the home page and carry their content's Fitzgerald colour, so green leads to
  verbs and purple to describing words instead of every nav button being grey.
  Core pages are always level 1. **Next for depth:** the persistent region caps
  at 24 words, so growing core toward the research target of 200–400 means
  filling these pages — 6×10 currently holds 307 words of a possible 1,214
  without any new machinery.
- [~] **Enhanced neural voice (Piper, §10.5)** — synthesizing in-browser from
  fully self-hosted assets: `"I want juice"` → 1.03 s of real audio, session
  init 921 ms once, then **RTF 0.18** (5x faster than realtime). The spike's
  RTF 2.25 was `vits-web` rebuilding the ONNX session every call; one
  persistent session is ~13x better. Optional ~60 MB download, standard voice
  stays the default, and the router falls back per-utterance so a failed model
  can never leave someone without a voice.
  Deploy packaging **is done** — `deploy.yml` caches and fetches the models
  and fails the build if they are unavailable, now one per language (§19.7).
  **Remaining:** cache pre-warming, storage management, and real-device QA
  (iOS needs a user gesture for AudioContext).
- [~] **Vocabulary sizes + levels — the structural spine (§19.2/§19.3).**
  The seed generator is now size-driven: each grid size is an independently
  authored page set (§19.2 — a motor-plan layout cannot be reflowed), with
  5×6 keeping the exact ids it shipped with. A second size (3×4 simplified,
  6 core words) ships. Vocabulary levels reveal words **in place**, so raising
  a level never moves a button, and the level control hides itself on a board
  with only one level. `buildSet()` is the single source of truth for both
  seeding and the level map, so they cannot drift.
- [x] **Vocabulary depth at 5×6 (§19.4)** — 144 → **203 words**, inside the
  spec's own 200–250 target: the three topics §19.4 listed but we never shipped
  (House, Describing, Social), every topic page filled out, and topic overflow
  via "More" pages. Fixed a silent content bug on the way — the 15th Actions
  word never became a button, dropped by the off-grid row filter. Every
  core-board page now keeps a free cell, enforced in the generator, because a
  100%-full board cannot be personalised.
- [x] **6×10 expanded board (§19.2)** — **307 words**, and a **24-word core**,
  which is the point: the core region is `rows × coreColumns` cells and is full
  at every size, so 15 was a ceiling no amount of authoring could lift within
  5×6. Three boards now ship — 26 / 203 / 307 words at 6 / 15 / 24 core words —
  chosen once at setup, since a motor-plan layout cannot be reflowed. Weather
  returns here, where there is navigation room for it.
- [x] **Full device backup (§14.3)** — one JSON file carrying profiles, voice
  and access-method tuning, PIN, pages, word lists, history, learned
  prediction words and tracking. `.obz` is vocabulary-only, so until now a
  cleared browser or a replaced device lost everything a family and SLP had
  configured. Restore validates and describes the file, then requires a second
  confirming tap before replacing anything.
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
  and never shifts between edit and use mode (§19.6 motor-plan invariant).
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
interoperability, offline PWA, multi-profile, and — new — **English +
Spanish**, the row where every competitor including the free ones used to
beat us.

**The gaps that make us look incomplete** (Tier 1 below) and **the bets
that make us clearly better** (Tier 2) are where the backlog focuses.

---

## 2. Prioritized backlog

### Tier 1 — Table stakes (competitors have these; we look incomplete without)

| Item | Why it matters (who has it) | Effort | Status |
|---|---|---|---|
| **Word prediction** (offline n-gram) in the keyboard | Every major app; makes the text/literacy path usable | M | [x] |
| **Word forms / grammar** (long-press → plural, tense, possessive) | Proloquo, Grid 3; separates "toddler board" from real language | M–L | [x] |
| **Grid size + vocabulary level** at setup | All of them. Three authored sizes (3×4 / 5×6 / 6×10), levels that reveal in place, Settings controls, size choice in the onboarding page-set chooser. Remaining: a level picker at onboarding, and SLP review of the word lists (§19.6 release gate, now once per language) | M | [~] |
| **Message history / favorites** | Proloquo2Go, TD Snap | S | [x] |
| **Word-by-word highlight while speaking** | TD Snap/Proloquo; literacy support | M | [x] |

### Tier 2 — Differentiators (make us *better*, lean into free + open)

| Item | Why it wins | Effort | Status |
|---|---|---|---|
| **Natural neural TTS (Piper)** | Kills the robot-voice problem for good; competitors *charge* for premium voices. Synthesizing in-browser at RTF 0.18 from self-hosted assets, one model per language. Deploy packaging done; remaining work is cache pre-warming, storage management and real-device QA | L (~1–2 wk) | [~] |
| **Spanish core set → multilingual** | ARASAAC symbols are already localized in 10+ languages (differentiator D-05); TouchChat/LAMP charge per language. Huge underserved reach. **Shipped** — see §0; the remaining work is the §19.6 SLP sign-off for the Spanish boards | M+L | [x] |
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
| **Optional cloud sync + team sharing** (SLP ↔ parent ↔ teacher) | CoughDrop's core selling point; unlocks multi-device. Stay local-first/private by default, sync opt-in. Full backup (§14.3) already covers device loss and device transfer, so this is now about live sharing, not durability | L | [ ] |
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

1. **Vocabulary depth + grid size / level at setup.** The deepest remaining
   hole: 15 core words in a 15-cell region (100% full) and 144 words total,
   two levels deep. §19.2 rules out reflowing a motor-plan layout, so sizes
   are separately *authored* variants chosen once at setup, while levels
   reveal words in place so nothing ever moves. Everything else compounds on
   this — a great voice reading a 144-word board is still a 144-word board.
2. **The flagship bet:** **Piper natural TTS.** Highest strategic
   leverage — permanently ends the robot-voice problem *and* becomes a
   free-premium-voice headline no competitor matches. De-risked (already
   validated); first step is a pluggable TTS backend + graceful fallback.
3. ~~**Reach expander:** Spanish core set~~ — **shipped** (§0). The thesis
   holds: the i18n machinery is now language-agnostic, so a third language is
   authoring work (board, lexicon, strings, Piper voice) plus a morphology
   engine only if the language inflects in ways English and Spanish do not.
4. **Then:** VSD → recorded audio / pronunciation → cloud sync / SLP tools.

---

## Appendix — competitor one-liners

- **TD Snap** ($9.99/mo): iPad-first; Core First/Motor Plan/Express/Text/
  Scanning/Aphasia; PCS symbols (proprietary); Acapela voices + My-Own-Voice;
  cloud tracking. Our answer: free, open symbols, OBF, transparent privacy.
- **Proloquo2Go / Proloquo** ($249 one-time): gold-standard symbol AAC;
  strong motor planning; 100+ voices; iOS-only. Our answer: cross-platform,
  free, motor-plan parity via the persistent core region.
- **LAMP / Speak for Yourself** ($149–299): motor-planning/automaticity —
  "a word never moves." We honor the same invariant (§19.6).
- **CoughDrop** ($9/mo or $295): web + cross-platform; cloud team sharing;
  strong reporting; supports OBF. Our answer: local-first + *optional* free
  sync, no subscription.
- **Cboard / AsTeRICS Grid** (open source): closest free peers; we aim past
  them on access methods, motor planning, and (with Piper) voice quality.
