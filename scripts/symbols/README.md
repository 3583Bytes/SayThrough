# Symbol pipeline (spec §9.1 / §9.4)

Build-time scripts — never run on user devices.

## Seed subset (committed, keeps every clone working)

```
node scripts/symbols/download-index.mjs en    # ARASAAC index → data/ (gitignored)
node scripts/symbols/download-index.mjs es    # …one per language: es, pl, br
node scripts/symbols/download-index.mjs pl
node scripts/symbols/download-index.mjs br
node scripts/symbols/build-seed-symbols.mjs   # seed words → public/symbols/ + seedSymbolMap.json
node scripts/symbols/build-symbol-index.mjs   # search indexes from hosted symbols
```

**One index per language (§19.7).** `build-symbol-index.mjs` writes
`public/symbolIndex/{en,es,pl,pt}.json` — the same pictogram ids in every
file, with that language's keywords. The picker fetches only the profile's,
so a Polish board is customised by typing Polish rather than by guessing the
English word. Note the locale mismatch: **ARASAAC calls Brazilian Portuguese
`br`**, and `pt` is European Portuguese — the board is Brazilian, so the
build reads `br` and writes `pt.json`. Coverage is not complete in every
language (Polish ~92%); a pictogram with no keyword in a language borrows the
English one, because an English label beats an unreachable picture.

`symbol-overrides.json` holds hand-curated label→id picks that beat
keyword matching (visually verified; e.g. "stop" keyword-matched a bus
stop). Edit it, re-run build-seed-symbols, done.

## Full library (release asset, never in git — ~165 MB)

```
node scripts/symbols/download-all-symbols.mjs  # all ~13,800 pictograms → data/library/ (1–3 h, resumable)
node scripts/symbols/pack-library.mjs          # tarball incl. the per-language indexes
gh release create symbols-v1 \
  --title "Symbol library v1" \
  --notes "ARASAAC (CC BY-NC-SA 4.0) WebP library for deploys" \
  scripts/symbols/data/saythrough-symbols.tar.gz
```

The deploy workflow downloads the `symbols-v1` release asset and unpacks it
into the site at build time. If the release does not exist the deploy still
succeeds and logs a notice, falling back to the committed seed subset; a
release that exists but fails to download fails the deploy, because that is a
real problem rather than an expected state. For local full-catalog
testing: `node scripts/symbols/sync-library.mjs` (public/symbols/ is
gitignored beyond the committed seed subset).

Attribution: ARASAAC pictograms © Government of Aragón, author Sergio
Palao, CC BY-NC-SA 4.0. Mulberry (CC BY-SA 4.0) joins the pipeline with
its own download step.
