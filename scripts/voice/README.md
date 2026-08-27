# Enhanced voice pipeline (spec §10.5)

Build-time scripts — never run on user devices. Everything the enhanced voice
needs is served from our own origin, same rule as symbols (§9.1): school
filters block unlisted domains, so a voice that fetched from a CDN would fail
in exactly the districts this app is built for.

## Assets

| Asset | Size | How it gets there |
|---|---|---|
| ONNX Runtime wasm | ~19 MB | `build-runtime.mjs`, from node_modules, on every `npm run build` |
| espeak-ng phonemizer | ~18 MB | `build-phonemizer.mjs`, same |
| Voice model + config | ~60 MB | `download-voice.mjs` → **published as the `voice-v1` release** |

The first two are regenerated from `node_modules` on every build, so they need
no release. The model is too big for git and is fetched by the deploy.

## Getting the model

```sh
npm run voice     # → public/voices/ (gitignored, ~60 MB, ~20s)
```

**The deploy does this itself** — there is no manual publishing step. It runs
the same command, cached between runs so a normal deploy does not re-download.
An earlier design staged the model through a `voice-v1` release, which meant
the feature stayed silently dead until a human remembered to publish it. The
symbol library is staged that way because it is assembled from ~13,800
individual API calls; a single file from a stable public URL is not the same
problem.

`scripts/check-deploy.mjs` verifies afterwards that the deployed site actually
serves the model — a green build is not the same as a working site. **If the
download fails the deploy still succeeds** — it logs a
notice, and the app reports "The enhanced voice is not available on this site
yet" instead of failing silently. The standard platform voice is unaffected
either way.

## Notes that cost time to find

- **`@diffusionstudio/vits-web` cannot be used.** `HF_BASE`, `ONNX_BASE` and
  `WASM_BASE` are exported consts (huggingface / cdnjs / jsdelivr) with no
  runtime override, and it sets `numThreads = hardwareConcurrency`, which needs
  COOP/COEP headers static hosting cannot send.
- **Single-threaded ORT only**, for that same header reason — the same
  limitation that put this app on IndexedDB instead of expo-sqlite.
- **The phonemizer's `--input` must be a JSON array**: `[{ text }]`. A bare
  object aborts with no error message, and `--input` is not listed in
  `--help`. `Module.stdin` and fd-0 redirection both silently produce nothing.
- **One persistent `InferenceSession`.** ~900 ms once, then RTF ~0.18. Creating
  a session per utterance costs 2–3 s and is slower than realtime.
