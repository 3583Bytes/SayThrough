import { Platform } from 'react-native'

// Reports to the Presence service (dashboard.3583bytes.com) so the project
// can tell whether anyone is actually using the app.
//
// The id is random and regenerated every session — it is never persisted, so
// it cannot follow anyone between sessions or be tied to a person. Nothing
// else is sent: no name, no profile, no page, and nothing anyone says, types
// or taps. Communication never leaves the device.
//
// The opt-out lives in localStorage rather than the profile, so it applies
// before any profile loads and is shared with the marketing site's script.

const ENDPOINT = 'https://dashboard.3583bytes.com'
const APP_NAME = 'SayThrough App'
const INTERVAL_MS = 60 * 1000 // Presence drops a client after 5 minutes
const OPT_OUT_KEY = 'saythrough-usage-counting'

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null // Safari private mode throws on access
  }
}

export function isUsageCountingEnabled(): boolean {
  return storage()?.getItem(OPT_OUT_KEY) !== 'off'
}

export function setUsageCountingEnabled(enabled: boolean): void {
  try {
    storage()?.setItem(OPT_OUT_KEY, enabled ? 'on' : 'off')
  } catch {
    // nothing to remember if storage is unavailable
  }
}

function optedOut(): boolean {
  const nav = typeof navigator === 'undefined' ? undefined : (navigator as any)
  if (nav?.doNotTrack === '1' || nav?.globalPrivacyControl === true) return true
  return !isUsageCountingEnabled()
}

// Regenerated per launch and held only in memory.
let sessionId: string | null = null
function id(): string {
  if (sessionId) return sessionId
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  sessionId =
    'app-' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return sessionId
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

let timer: ReturnType<typeof setInterval> | null = null

function beat(): void {
  if (optedOut()) return
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  const player = id()
  void sha256Hex(player)
    .then((key) =>
      fetch(`${ENDPOINT}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Secret-Key': key },
        body: JSON.stringify({ game_name: APP_NAME, player_id: player }),
        keepalive: true,
      }),
    )
    .catch(() => {
      // never let a counter break the app
    })
}

/** Start reporting. Safe to call more than once; failure is always silent. */
export function startUsageCounting(): void {
  if (Platform.OS !== 'web' || timer) return
  if (typeof crypto === 'undefined' || !crypto.subtle) return // needs https
  beat()
  timer = setInterval(beat, INTERVAL_MS)
}
