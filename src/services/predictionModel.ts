import { storage } from '../storage'
import { EMPTY_MODEL, learn, type PersonalModel } from './prediction'
import { isModeling } from './modelingMode'

// §18.2 layer 2 — persistence for the per-profile prediction model. Kept as a
// JSON blob in the meta table, keyed by profile, following the
// services/messageHistory.ts precedent: the model is a few KB and rewritten
// once per spoken message, which is far cheaper than the two storage-driver
// implementations plus a migration a dedicated table would cost
// (createStorage.ts is SQLite, createStorage.web.ts is IndexedDB).
//
// The model is held in memory as well as on disk because the keystroke path
// cannot await — see currentModel().

const GUEST = 'guest'
const key = (userId: string | undefined) => `prediction:${userId ?? GUEST}`

let cachedKey: string | null = null
let cached: PersonalModel = EMPTY_MODEL

function parse(raw: string | null): PersonalModel {
  if (!raw) return EMPTY_MODEL
  try {
    const parsed = JSON.parse(raw) as Partial<PersonalModel>
    return {
      unigrams: parsed.unigrams && typeof parsed.unigrams === 'object' ? parsed.unigrams : {},
      bigrams: parsed.bigrams && typeof parsed.bigrams === 'object' ? parsed.bigrams : {},
    }
  } catch {
    return EMPTY_MODEL
  }
}

/** Load (and memoize) the active profile's model. Call on profile change. */
export async function loadModel(userId: string | undefined): Promise<PersonalModel> {
  const k = key(userId)
  if (cachedKey === k) return cached
  cached = parse(await storage.getMeta(k))
  cachedKey = k
  return cached
}

/**
 * The in-memory model, for the per-keystroke ranking path. Returns an empty
 * model until loadModel resolves, which degrades to plain corpus frequency
 * rather than to nothing.
 */
export function currentModel(): PersonalModel {
  return cached
}

/**
 * Fold a spoken message into the model. Called from messageStore on speak —
 * NOT per keystroke, so words typed and then deleted never train it.
 */
export async function learnFromMessage(
  userId: string | undefined,
  words: string[],
): Promise<void> {
  // An SLP demonstrating on the device is not the user talking.
  if (isModeling()) return

  const model = await loadModel(userId)
  const next = learn(model, words)
  cached = next
  cachedKey = key(userId)
  // Guest sessions persist nothing (§4.14) — the model lives for the session.
  if (userId && userId !== GUEST) {
    await storage.setMeta(key(userId), JSON.stringify(next))
  }
}

/**
 * Clear learned words for one profile, leaving tracking, history and
 * vocabulary untouched (§18.4).
 */
export async function resetLearning(userId: string | undefined): Promise<void> {
  cached = EMPTY_MODEL
  cachedKey = key(userId)
  if (userId && userId !== GUEST) {
    await storage.setMeta(key(userId), JSON.stringify(EMPTY_MODEL))
  }
}
