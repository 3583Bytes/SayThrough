import { seedIfNeeded } from '../data/seedCoreVocabulary'
import { storage } from '../storage'
import { useNavigationStore } from '../stores/navigationStore'
import { useUserStore } from '../stores/userStore'
import { initPwa, warmupSymbolCache } from './pwa'
import { getSymbolUri } from './SymbolService'
import { ttsService } from './TTSService'

// App startup: storage → seed → profile → navigation → TTS.
// Runs once from App before the navigator renders.
export async function bootstrap(): Promise<void> {
  await storage.init()
  const coreSetId = await seedIfNeeded(storage)

  const userStore = useUserStore.getState()
  await userStore.load()
  if (!useUserStore.getState().activeUser) {
    await userStore.createUser('My voice', coreSetId)
  }

  const activeUser = useUserStore.getState().activeUser!
  const pageSet =
    (await storage.getPageSet(activeUser.activePageSetId)) ??
    (await storage.getPageSet(coreSetId))
  if (pageSet) {
    useNavigationStore.getState().setActivePageSet(pageSet.id, pageSet.rootPageId)
    void warmupActiveSetSymbols(pageSet.id) // fire-and-forget
  }

  initPwa()
  ttsService.init()
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
