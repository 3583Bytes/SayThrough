import { seedIfNeeded } from '../data/seedCoreVocabulary'
import { storage } from '../storage'
import { useNavigationStore } from '../stores/navigationStore'
import { useUserStore } from '../stores/userStore'
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
  }

  ttsService.init()
}
