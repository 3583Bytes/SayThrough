// Post-deploy smoke check: does the LIVE site actually serve what the app
// needs?
//
// Written after a deploy went green while the enhanced voice was silently
// unavailable — the model comes from a release that did not exist, the deploy
// step treated that as expected, and nothing surfaced it until someone opened
// Settings by hand days later.
//
// Required assets fail the build. Optional ones warn loudly, because "green
// build, degraded feature" is the failure mode this exists to prevent.
//
// Usage: node scripts/check-deploy.mjs [baseUrl]

const BASE = (process.argv[2] ?? 'https://saythrough.com').replace(/\/$/, '')

const CHECKS = [
  { path: '/', required: true, label: 'marketing site' },
  { path: '/app/', required: true, label: 'app shell' },
  { path: '/contact/', required: true, label: 'contact page' },
  {
    path: '/app/symbolIndex.json',
    required: true,
    label: 'symbol index',
    verify: async (res) => {
      const list = await res.json()
      if (!Array.isArray(list) || list.length < 300) {
        throw new Error(`only ${list.length} symbols — the library did not deploy`)
      }
      return `${list.length} symbols`
    },
  },
  { path: '/app/prediction/en.txt', required: true, label: 'prediction lexicon (en)' },
  { path: '/app/prediction/es.txt', required: true, label: 'prediction lexicon (es)' },
  { path: '/app/ort/ort.wasm.min.js', required: true, label: 'ONNX runtime' },
  { path: '/app/voice/piper_phonemize.js', required: true, label: 'phonemizer' },
  // Optional: the app falls back to the platform voice and says so. One per
  // language — a missing Spanish model is invisible to an English tester, so
  // it has to be checked explicitly rather than inferred from the English one.
  ...[
    ['en', 'en_US-hfc_female-medium'],
    ['es', 'es_ES-sharvard-medium'],
  ].map(([lang, model]) => ({
    path: `/app/voices/${model}.onnx.json`,
    required: false,
    label: `enhanced voice model (${lang})`,
    hint:
      'the deploy fetches this itself (npm run voice / voice:es) — a warning ' +
      'here means that download failed, not that a manual step was missed',
    verify: async (res) => {
      const config = await res.json()
      return `${config.audio?.sample_rate} Hz`
    },
  })),
]

// GitHub Pages serves the SPA shell for unknown /app/* paths, so a 200 with
// HTML is a miss — checking the status code alone would pass.
async function fetchAsset(url) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return { ok: false, why: `HTTP ${res.status}` }
  const type = res.headers.get('content-type') ?? ''
  if (url.includes('.json') && !type.includes('json')) {
    return { ok: false, why: 'served the SPA shell, not the file' }
  }
  return { ok: true, res }
}

// Pages can take a moment to propagate after a deploy.
async function withRetry(url, attempts = 6) {
  let last
  for (let i = 0; i < attempts; i++) {
    try {
      last = await fetchAsset(url)
      if (last.ok) return last
    } catch (error) {
      last = { ok: false, why: error.message }
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 5000 * (i + 1)))
  }
  return last
}

console.log(`Checking ${BASE}\n`)
let failed = 0
let degraded = 0

for (const check of CHECKS) {
  const url = BASE + check.path
  const result = await withRetry(url, check.required ? 6 : 2)
  if (result.ok) {
    let extra = ''
    try {
      if (check.verify) extra = ' — ' + (await check.verify(result.res))
    } catch (error) {
      if (check.required) failed++
      else degraded++
      console.log(`${check.required ? 'FAIL' : 'WARN'}  ${check.label}: ${error.message}`)
      continue
    }
    console.log(`ok    ${check.label}${extra}`)
  } else if (check.required) {
    failed++
    console.log(`FAIL  ${check.label} — ${result.why}  (${check.path})`)
    if (process.env.GITHUB_ACTIONS) console.log(`::error::${check.label} is missing from the deploy`)
  } else {
    degraded++
    console.log(`WARN  ${check.label} — ${result.why}`)
    console.log(`      the app works without it, but the feature is dead: ${check.hint ?? ''}`)
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::warning::${check.label} is not deployed — ${check.hint ?? ''}`)
    }
  }
}

console.log()
if (failed) {
  console.error(`${failed} required asset(s) missing.`)
  process.exit(1)
}
console.log(degraded ? `Deploy is up, ${degraded} optional feature(s) unavailable.` : 'Deploy is complete.')
