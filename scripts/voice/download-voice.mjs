// §10.5 step 2 — fetch a Piper voice model so it can be SELF-HOSTED.
//
// Same rule as the symbol library and the ONNX runtime: zero third-party
// requests at run time. The model is downloaded here at build/release time,
// published as a GitHub release asset, and unpacked into the site at deploy —
// user devices only ever talk to saythrough.com.
//
// Default voice is en_US-hfc_female-medium, validated in the spike as
// sounding good at 0.8x speed (length_scale ~1.25 in the voice config).
//
// Output: scripts/voice/data/ (gitignored, ~63 MB)
// Usage:  node scripts/voice/download-voice.mjs [voiceId]

import { mkdir, writeFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const voiceId = process.argv[2] ?? 'en_US-hfc_female-medium'
const here = dirname(fileURLToPath(import.meta.url))
const dataDir = join(here, 'data')

// Official Piper voices. Path shape: {lang}/{locale}/{name}/{quality}/{file}
const [locale, name, quality] = voiceId.split('-')
const BASE = 'https://huggingface.co/rhasspy/piper-voices/resolve/main'
const dir = `${locale.split('_')[0]}/${locale}/${name}/${quality}`

await mkdir(dataDir, { recursive: true })

for (const suffix of ['.onnx', '.onnx.json']) {
  const url = `${BASE}/${dir}/${voiceId}${suffix}?download=true`
  const outPath = join(dataDir, `${voiceId}${suffix}`)
  process.stdout.write(`Fetching ${voiceId}${suffix}… `)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} for ${url}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  await writeFile(outPath, buffer)
  console.log(`${(buffer.length / 1024 / 1024).toFixed(1)} MB`)
}

// The .onnx.json carries sample_rate, phoneme_id_map and inference defaults
// (noise_scale, length_scale) that the backend needs at run time.
const config = JSON.parse(
  await (await import('node:fs/promises')).readFile(
    join(dataDir, `${voiceId}.onnx.json`),
    'utf8',
  ),
)
console.log(
  `\n${voiceId}: ${config.audio?.sample_rate ?? '?'} Hz, ` +
    `${Object.keys(config.phoneme_id_map ?? {}).length} phoneme ids, ` +
    `length_scale ${config.inference?.length_scale ?? '?'}`,
)
console.log(`Model: ${((await stat(join(dataDir, `${voiceId}.onnx`))).size / 1024 / 1024).toFixed(1)} MB`)
