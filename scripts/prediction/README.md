# Prediction lexicon pipeline

Build-time scripts — never run on user devices.

```
node scripts/prediction/download-lexicon.mjs en   # raw list → data/ (gitignored)
node scripts/prediction/build-lexicon.mjs en      # filter + clean → public/prediction/en.txt
```

Or `npm run lexicon` for both (English). For another language, pass its code
to each script — the source repo covers ~50 languages, which is the same
pipeline the Spanish core set will need.

Unlike the symbol library, the built lexicon **is committed** (~237 KB, 114 KB
gzipped), so a fresh clone has working prediction without running anything.

## Why 30,000 words

10k covers ~95% of conversational English, but subtitle dialogue is verb- and
pronoun-heavy and under-ranks concrete nouns: *broccoli* (13.5k), *giraffe*
(13.2k), *inhaler* (19k) and *trampoline* (20.6k) all fall outside a 10k cut.
Those are precisely the words someone opens the keyboard for — if a word is
common enough to sit in the top 10k it is probably already on a button. The
tail costs ~80 KB gzipped and buys the food, animal and medical vocabulary the
keyboard exists to reach.

## Output format

`public/prediction/{lang}.txt` is one word per line, most frequent first, and
nothing else — no counts, no header. The order *is* the frequency signal:
`prediction.ts` scans from the top and stops at the first K prefix matches,
which are therefore the K most frequent matches. Storing counts would double
the file size to feed a column nothing reads.

The service worker picks the file up through its stale-while-revalidate
catch-all (the same path `symbolIndex.json` takes), so it is offline after
first fetch and needs no precache entry.

## Why this corpus

[FrequencyWords](https://github.com/hermitdave/FrequencyWords) is derived from
OpenSubtitles — film and TV dialogue. That conversational register is a much
better match for how AAC users actually talk than a literary or news corpus,
where "shall" and "moreover" outrank "hungry".

Licensing: the generator code is MIT, **the word lists are CC BY-SA 4.0**.
Our filtered lists are a derivative and stay CC BY-SA 4.0 — attribution ships
in `public/prediction/ATTRIBUTION.txt` and in the root README, alongside the
existing ARASAAC and Mulberry notices.

## What the build strips, and why it has to

Subtitle data cannot be shipped raw:

| Problem | Example | Handling |
|---|---|---|
| Profanity ranks near the top | `shit` at rank 285, `fuck` at 299 | `blocklist.json`, exact match |
| Contractions are split apart | no `don't` anywhere; `'t` ranks 10th | `contractions.json` → `add` |
| Split stems are left behind | `don` at rank 31, `doesn` at 208 | `contractions.json` → `dropRaw` |
| Apostrophe-less misspellings | `dont`, `youre` | `contractions.json` → `dropRaw` |
| Tokenizer debris | `'s`, `i-i`, `i.`, bare letters | shape rules in `build-lexicon.mjs` |

Two rules matter more than they look:

**Blocking is exact-match, never prefix or substring.** A prefix rule on `ass`
eats *assistant, assume, assault, assignment, association*; a substring rule on
`cock` eats *cocktail*. Add inflections explicitly instead.

**Real words that resemble debris stay.** `won`, `can` and `haven` are stems of
*won't / can't / haven't* but are also ordinary English; `ill`, `well`, `were`,
`its`, `shed`, `wed`, `lets` and `id` are real words that look like the
apostrophe-less misspellings. Dropping a word an AAC user needs is a worse
failure than mis-ranking a rare one.

## Scope of the blocklist

It removes vulgar and slur vocabulary from **autocomplete only**. It is not a
censor: any word can still be put on a button or typed letter by letter.
Blocking means only that we will not *suggest* the word unprompted.

Clinical and protective vocabulary is deliberately **kept** — body parts,
health and personal-care terms, and words like *rape*, *abuse*, *hurt*,
*private*, *scared*. AAC users are abused at far higher rates than the general
population, and lacking words to describe bodies and assault is a documented
barrier to disclosure; stripping that vocabulary would fail them exactly when
it matters most. `build-lexicon.mjs` fails the build if a blocklist edit ever
collides with the `_keptDeliberately` list, and restores any of those words
that fall outside the frequency cut — appended last, so they are reachable when
deliberately typed but never suggested out of nowhere.
