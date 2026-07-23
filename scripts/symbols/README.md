# Symbol pipeline (spec §9.1)

Build-time scripts — never run on user devices.

```
node scripts/symbols/download-index.mjs        # 1. full ARASAAC index → data/ (gitignored)
node scripts/symbols/build-seed-symbols.mjs    # 2. seed-word subset → public/symbols/arasaac/ + seedSymbolMap.json
```

The seed subset (~70 WebP files, <500 KB) IS committed — it makes the
deployed demo work offline. The **full-library run** (~13,500 files,
~165 MB) must NOT be committed; when it lands, output goes to a release
artifact / CDN bucket instead, and `public/symbols/` gets gitignored.
Sizes and delivery strategy: docs/technical-specification.md §9.4.

Attribution: ARASAAC pictograms © Government of Aragón, author Sergio
Palao, CC BY-NC-SA 4.0. Mulberry (CC BY-SA 4.0) joins the pipeline with
its own download step.
