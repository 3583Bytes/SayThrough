# SayThrough usage counters

A deliberately small service that answers one question — *is anyone using
SayThrough?* — without collecting anything about who they are.

## The design rule

**Counts, and nothing else.** No user id, no session id, no cookie, no device
fingerprint, no IP log, no free-text paths, no message content. There is no
identifier stored, so there is nothing to leak, subpoena, or accidentally join
against another dataset.

This is not caution for its own sake. SayThrough's users are largely children
with disabilities, and everything they say goes through this app. The product's
central promise is that their communication never leaves the device.

**What it costs:** 1,240 app opens could be 1,240 people or one person 1,240
times. Daily-unique counts are not offered, because counting uniques requires
an identifier. Trends over time are meaningful; precise reach is not.

## Run it

```sh
cd stats-service && npm install
PORT=8090 DATA_DIR=/var/lib/saythrough-stats npm start
npm test          # no framework; plain asserts against a live server
```

Deploy it behind `stats.saythrough.com`. **The subdomain matters**: school
districts whitelist by domain, so a separate host would be filtered on exactly
the networks this app is built for.

## API

| Route | Purpose |
|---|---|
| `POST /event` | `{ event, path? }`. Allow-listed events only; unknown ones are 400. |
| `GET /summary` | Totals, today, and the last 90 days — what the dashboard renders. |
| `GET /health` | Liveness. |

Events: `pageview`, `app_open`, `app_install`. Paths are allow-listed too, so a
URL carrying a query string can never reach disk.

An in-memory per-IP burst cap (60/min) stops a runaway loop inflating counts.
It is never persisted; it exists to protect the numbers, not to identify
anyone. Counters are flushed to `DATA_DIR/counters.json` every 10s and pruned
to 400 days.

## Client side

- `site/analytics.js` — marketing pages, sends `pageview`
- `src/services/usageCounter.ts` — the app, sends `app_open` / `app_install`
- `site/stats/index.html` — the public dashboard at `/stats/`

Both clients honour Do Not Track, Global Privacy Control, and a shared
`saythrough-usage-counting` opt-out exposed in the app under Settings →
Privacy. `tests/e2e/analytics.spec.ts` asserts the opt-out works on both
surfaces and that nothing typed or spoken is ever transmitted.
