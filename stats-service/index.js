// SayThrough usage counters.
//
// DESIGN RULE, and the reason this is not a general analytics service:
// SayThrough's users are largely children with disabilities, and the product
// promises their data never leaves the device. So this service stores COUNTS
// AND NOTHING ELSE. There is no user id, no session id, no cookie, no device
// fingerprint, no IP log, no path beyond a short allow-list, and no way to
// reconstruct an individual from what is kept. "Daily uniques" is deliberately
// not offered: counting uniques requires an identifier, and there is no
// identifier here to count.
//
// What that costs: 1,240 app opens could be 1,240 people or one person 1,240
// times. Trends over time are still meaningful; precise reach is not. That is
// the correct trade for this user group.

const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()

const ALLOWED_ORIGINS = new Set([
  'https://saythrough.com',
  'https://www.saythrough.com',
  'http://localhost:8080', // local dev against a built dist/
])

// Only these event names are ever recorded. Anything else is dropped, so a
// future caller cannot quietly start logging something more revealing.
const EVENTS = new Set(['pageview', 'app_open', 'app_install'])

// Marketing paths are recorded so we can see which guide people read. The
// allow-list means an arbitrary URL — which could carry query strings — can
// never be written to disk.
const PATHS = new Set(['/', '/guides/', '/guides/quick-start/', '/guides/what-is-aac/', '/404'])

const PORT = process.env.PORT || 8090
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')
const DATA_FILE = path.join(DATA_DIR, 'counters.json')
const RETAIN_DAYS = 400
const TIME_ZONE = process.env.DAY_ROLLOVER_TIME_ZONE || 'America/Edmonton'

// Per-IP burst cap. Held in memory only and never written to disk — it exists
// to stop a runaway loop inflating counts, not to identify anyone.
const BURST_WINDOW_MS = 60 * 1000
const BURST_MAX = 60
const burst = new Map()

app.use(express.json({ limit: '4kb' }))

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.has(origin.toLowerCase())) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

function today() {
  // Intl gives a stable YYYY-MM-DD in the configured zone without a date lib.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  } catch {
    return { days: {} }
  }
}

let counters = load()
let dirty = false

function save() {
  if (!dirty) return
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(counters))
    dirty = false
  } catch (error) {
    console.error('stats: could not persist counters —', error.message)
  }
}

function prune() {
  const days = Object.keys(counters.days).sort()
  while (days.length > RETAIN_DAYS) {
    delete counters.days[days.shift()]
    dirty = true
  }
}

function rateLimited(req) {
  const key = req.ip || 'unknown'
  const now = Date.now()
  const entry = burst.get(key)
  if (!entry || now - entry.since > BURST_WINDOW_MS) {
    burst.set(key, { since: now, count: 1 })
    return false
  }
  entry.count += 1
  return entry.count > BURST_MAX
}

app.post('/event', (req, res) => {
  const { event, path: pagePath } = req.body ?? {}
  if (!EVENTS.has(event)) {
    return res.status(400).json({ error: 'Unknown event.' })
  }
  if (rateLimited(req)) return res.status(429).json({ error: 'Too many.' })

  const day = (counters.days[today()] ??= {})
  day[event] = (day[event] ?? 0) + 1

  if (event === 'pageview' && PATHS.has(pagePath)) {
    const paths = (day.paths ??= {})
    paths[pagePath] = (paths[pagePath] ?? 0) + 1
  }

  dirty = true
  res.status(204).end()
})

app.get('/summary', (_req, res) => {
  const days = Object.keys(counters.days).sort()
  const recent = days.slice(-90)
  const sum = (event) =>
    days.reduce((total, day) => total + (counters.days[day][event] ?? 0), 0)

  res.json({
    generatedAt: new Date().toISOString(),
    timeZone: TIME_ZONE,
    totals: {
      pageview: sum('pageview'),
      app_open: sum('app_open'),
      app_install: sum('app_install'),
    },
    today: counters.days[today()] ?? {},
    daily: recent.map((day) => ({ day, ...counters.days[day] })),
  })
})

app.get('/health', (_req, res) => res.json({ status: 'ok', days: Object.keys(counters.days).length }))

setInterval(() => {
  prune()
  save()
}, 10 * 1000).unref?.()

process.on('SIGTERM', () => {
  save()
  process.exit(0)
})

if (require.main === module) {
  app.listen(PORT, () => console.log(`saythrough-stats on :${PORT} (${TIME_ZONE})`))
}

module.exports = { app, _internals: { load, save, today } }
