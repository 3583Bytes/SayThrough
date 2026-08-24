import { expect, test, type Page } from '@playwright/test'
import { enterEditMode, setupProfile } from './helpers'

// §10.5 enhanced neural voice. This is the test that matters: it drives the
// real ONNX runtime, the real espeak phonemizer and the real 60 MB model in a
// browser, because every one of those is a self-hosted asset that can only be
// proven to work by loading it.

async function openSettings(page: Page) {
  await enterEditMode(page)
  await page.getByLabel('Open settings').click()
  await page.getByText('Enhanced Voice', { exact: true }).waitFor()
}

test.describe('enhanced voice (§10.5)', () => {
  test('the standard voice is the default — nothing downloads unasked', async ({
    page,
  }) => {
    const heavy: string[] = []
    page.on('request', (r) => {
      if (/\.(onnx|wasm|data)$/.test(new URL(r.url()).pathname)) heavy.push(r.url())
    })
    await setupProfile(page)
    await page.getByLabel('I', { exact: true }).click()
    await page.getByLabel('Speak message').click()
    await page.waitForTimeout(500)

    expect(heavy).toEqual([])
  })

  test('synthesizes speech from the self-hosted model', async ({ page }) => {
    test.setTimeout(180_000)
    await setupProfile(page)
    await page.goto('/app/', { waitUntil: 'networkidle' })

    // Drive the backend directly: audio playback cannot be asserted, but the
    // sample buffer it would play can.
    const result = await page.evaluate(async () => {
      const load = (src: string) =>
        new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = src
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('load failed ' + src))
          document.head.appendChild(s)
        })
      await load('/app/ort/ort.wasm.min.js')
      await load('/app/voice/piper_phonemize.js')

      const ort = (globalThis as any).ort
      const createPiperPhonemize = (globalThis as any).createPiperPhonemize
      if (!ort || !createPiperPhonemize) return { error: 'runtime missing' }

      ort.env.wasm.numThreads = 1
      ort.env.wasm.wasmPaths = '/app/ort/'

      const config = await (await fetch('/app/voices/en_US-hfc_female-medium.onnx.json')).json()

      // Phonemize — the input must be a JSON array.
      const lines: string[] = []
      const mod = await createPiperPhonemize({
        print: (l: string) => lines.push(l),
        printErr: () => {},
        locateFile: (f: string) => '/app/voice/' + f,
        noInitialRun: true,
      })
      mod.callMain([
        '-l', 'en-us',
        '--input', JSON.stringify([{ text: 'I want juice' }]),
        '--espeak_data', '/espeak-ng-data',
      ])
      const ids: number[] = JSON.parse(lines[0]).phoneme_ids
      const phonemes: string = JSON.parse(lines[0]).phonemes.join('')

      const t0 = performance.now()
      const session = await ort.InferenceSession.create('/app/voices/en_US-hfc_female-medium.onnx')
      const initMs = performance.now() - t0

      const t1 = performance.now()
      const out = await session.run({
        input: new ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
        input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
        scales: new ort.Tensor('float32', Float32Array.from([
          config.inference.noise_scale, 1.25, config.inference.noise_w,
        ]), [3]),
      })
      const inferMs = performance.now() - t1
      const audio = out[session.outputNames[0]].data as Float32Array

      let peak = 0
      for (let i = 0; i < audio.length; i++) peak = Math.max(peak, Math.abs(audio[i]))

      return {
        phonemes,
        ids: ids.length,
        samples: audio.length,
        seconds: audio.length / config.audio.sample_rate,
        peak,
        initMs: Math.round(initMs),
        inferMs: Math.round(inferMs),
      }
    })

    console.log('enhanced voice:', JSON.stringify(result))
    expect((result as any).error).toBeUndefined()
    const r = result as any

    // Phonemization produced the expected pronunciation.
    expect(r.phonemes).toContain('dʒ')
    expect(r.ids).toBeGreaterThan(10)

    // Synthesis produced real, audible audio — not silence.
    expect(r.seconds).toBeGreaterThan(0.4)
    expect(r.seconds).toBeLessThan(5)
    expect(r.peak).toBeGreaterThan(0.05)

    // And it is faster than realtime, which is the whole design premise.
    expect(r.inferMs / 1000).toBeLessThan(r.seconds)
  })

  test('Settings offers the voice without forcing it', async ({ page }) => {
    await setupProfile(page)
    await openSettings(page)
    await expect(page.getByLabel('Standard voice', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Enhanced voice', { exact: true })).toBeVisible()
    await expect(page.getByText(/one-time ~60 MB download/)).toBeVisible()
  })
})
