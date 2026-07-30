import { storage } from '../storage'

// Per-profile message history: recently spoken messages (for re-speaking a
// repeated utterance) plus starred favorites. Kept out of the tracking
// system on purpose — this is a communication convenience, always on, not
// analytics, so it isn't consent-gated. Stored as a small JSON blob in the
// meta table, keyed by profile so users on a shared device don't mix.

const RECENTS_CAP = 25

export interface MessageHistory {
  recents: string[]
  favorites: string[]
}

const key = (userId: string | undefined) => `messageHistory:${userId ?? 'guest'}`

export async function loadHistory(userId: string | undefined): Promise<MessageHistory> {
  try {
    const raw = await storage.getMeta(key(userId))
    if (!raw) return { recents: [], favorites: [] }
    const parsed = JSON.parse(raw) as Partial<MessageHistory>
    return {
      recents: Array.isArray(parsed.recents) ? parsed.recents : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
    }
  } catch {
    return { recents: [], favorites: [] }
  }
}

async function save(userId: string | undefined, history: MessageHistory): Promise<void> {
  await storage.setMeta(key(userId), JSON.stringify(history))
}

// Record a just-spoken message: newest first, de-duplicated, capped.
export async function recordSpoken(
  userId: string | undefined,
  message: string,
): Promise<void> {
  const text = message.trim()
  if (!text) return
  const history = await loadHistory(userId)
  const recents = [text, ...history.recents.filter((m) => m !== text)].slice(
    0,
    RECENTS_CAP,
  )
  await save(userId, { ...history, recents })
}

// Star / unstar a phrase; favorites persist until removed.
export async function toggleFavorite(
  userId: string | undefined,
  message: string,
): Promise<MessageHistory> {
  const history = await loadHistory(userId)
  const has = history.favorites.includes(message)
  const favorites = has
    ? history.favorites.filter((m) => m !== message)
    : [message, ...history.favorites]
  const next = { ...history, favorites }
  await save(userId, next)
  return next
}
