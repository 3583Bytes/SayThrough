// Run with: node test.js   (no framework — the service has no build step)
const assert = require('node:assert')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'stats-'))
const { app } = require('./index.js')

let server, base
const post = (body) =>
  fetch(base + '/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

async function run() {
  server = app.listen(0)
  await new Promise((r) => server.once('listening', r))
  base = `http://127.0.0.1:${server.address().port}`

  // Accepts the allow-listed events.
  for (const event of ['pageview', 'app_open', 'app_install']) {
    assert.equal((await post({ event })).status, 204, event)
  }

  // Rejects anything not on the allow-list, so nothing new gets logged by
  // accident later.
  assert.equal((await post({ event: 'keystroke' })).status, 400)
  assert.equal((await post({})).status, 400)

  // Records allow-listed paths, ignores everything else — a URL with a query
  // string must never reach disk.
  await post({ event: 'pageview', path: '/guides/' })
  await post({ event: 'pageview', path: '/private?token=secret' })

  const summary = await (await fetch(base + '/summary')).json()
  assert.equal(summary.totals.pageview, 3)
  assert.equal(summary.totals.app_open, 1)
  assert.equal(summary.today.paths['/guides/'], 1)
  assert.deepEqual(Object.keys(summary.today.paths), ['/guides/'])

  // Nothing identifying is stored anywhere in the payload.
  const serialized = JSON.stringify(summary)
  for (const leak of ['token', 'secret', '127.0.0.1', 'ip', 'user', 'session']) {
    assert.ok(!serialized.toLowerCase().includes(leak), `leaked ${leak}`)
  }

  // CORS: the site is allowed, a stranger is not.
  const allowed = await fetch(base + '/event', {
    method: 'OPTIONS',
    headers: { Origin: 'https://saythrough.com' },
  })
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://saythrough.com')
  const denied = await fetch(base + '/event', {
    method: 'OPTIONS',
    headers: { Origin: 'https://evil.example.com' },
  })
  assert.equal(denied.headers.get('access-control-allow-origin'), null)

  // Burst cap stops a runaway loop.
  let limited = false
  for (let i = 0; i < 120; i++) {
    if ((await post({ event: 'app_open' })).status === 429) { limited = true; break }
  }
  assert.ok(limited, 'burst cap never engaged')

  server.close()
  fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true })
  console.log('stats-service: all checks passed')
}

run().catch((error) => {
  console.error('FAILED:', error.message)
  if (server) server.close()
  process.exit(1)
})
