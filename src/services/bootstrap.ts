import { seedIfNeeded } from '../data/seedCoreVocabulary'
import { storage } from '../storage'
import { useNavigationStore } from '../stores/navigationStore'
import { useUserStore } from '../stores/userStore'
import { warmLexicon } from './prediction'
import { startUsageCounting } from './usageCounter'
import { initPwa, warmupSymbolCache } from './pwa'
import { getSymbolUri } from './SymbolService'
import { ttsService } from './TTSService'

// App startup: storage → seed → profile → navigation → TTS.
// Runs once from App before the navigator renders.
export async function bootstrap(): Promise<void> {
  await storage.init()
  const coreSetId = await seedIfNeeded(storage)

  // No auto-created profile: with no users, App routes to onboarding
  // (§5.2), which creates the first profile or starts a guest session
  await useUserStore.getState().load()

  const activeUser = useUserStore.getState().activeUser
  const pageSet = activeUser
    ? ((await storage.getPageSet(activeUser.activePageSetId)) ??
      (await storage.getPageSet(coreSetId)))
    : await storage.getPageSet(coreSetId)
  if (pageSet) {
    useNavigationStore.getState().setActivePageSet(pageSet.id, pageSet.rootPageId)
    void warmupActiveSetSymbols(pageSet.id) // fire-and-forget
  }

  initPwa()

  // Usage reporting (Presence). Session-scoped random id, opt-out honoured,
  // failure silent — see usageCounter.ts.
  startUsageCounting()
  void pickAndPersistDefaultVoice() // non-blocking — voices load async

  // Prediction (§18). Fetching the lexicon now rather than on first keyboard
  // open means the service worker has it cached before the user ever goes
  // offline; the keyboard would otherwise be the one screen that silently
  // loses a feature on a plane or a school bus. The personal model is loaded
  // by userStore alongside the profile — this covers first run, where there is
  // no profile yet and onboarding is about to happen.
  warmLexicon(activeUser?.language)
}

// §10.2: without this, the browser picks its own default voice for the
// language — on macOS that can be a novelty voice ("Albert", "Zarvox")
// that sounds like a broken robot. Pick the best available voice once
// and persist it so Settings shows what's actually being used.
async function pickAndPersistDefaultVoice(): Promise<void> {
  await ttsService.init()
  const user = useUserStore.getState().activeUser
  if (!user) return
  // Self-heal: re-pick if the stored voice is missing, stale (not in the
  // current list), or a novelty voice — NOT only when it's empty. An
  // earlier bad/first-run value would otherwise stick forever and the
  // user keeps hearing the wrong voice.
  if (ttsService.isValidVoiceId(user.ttsVoiceId)) return
  const best = ttsService.bestVoiceId(user.language)
  if (best) {
    await useUserStore.getState().updateActiveUser({ ttsVoiceId: best })
  }
}

// Pre-caches every symbol the active page set references, so the user's
// vocabulary works offline even on pages not yet visited (spec §3)
async function warmupActiveSetSymbols(pageSetId: string): Promise<void> {
  const pages = await storage.getPagesForPageSet(pageSetId)
  const uris = new Set<string>()
  for (const page of pages) {
    for (const button of await storage.getButtonsForPage(page.id)) {
      if (button.symbolId) {
        const uri = getSymbolUri(button.symbolId)
        if (uri) uris.add(uri)
      }
    }
  }
  warmupSymbolCache([...uris])
}
