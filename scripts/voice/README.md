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

## Publishing the model (one-time, and on any voice change)

```sh
npm run voice                       # → public/voices/ (gitignored, ~60 MB)
gh release create voice-v1 \
  --title "Enhanced voice v1" \
  --notes "Piper en_US-hfc_female-medium (MIT). Self-hosted for §10.5." \
  public/voices/en_US-hfc_female-medium.onnx \
  public/voices/en_US-hfc_female-medium.onnx.json
```

`.github/workflows/deploy.yml` downloads these into `public/voices/` before the
build. **Until the release exists the deploy still succeeds** — it logs a
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
