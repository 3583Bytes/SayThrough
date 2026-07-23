import { useEffect, useState } from 'react'
import { SafeAreaView, StyleSheet, View } from 'react-native'
import { MessageBar } from '../components/communication/MessageBar'
import { SymbolGrid } from '../components/communication/SymbolGrid'
import { TopBar } from '../components/communication/TopBar'
import { seedIfNeeded } from '../data/seedCoreVocabulary'
import { executeButtonActions } from '../services/actionExecutor'
import { ttsService } from '../services/TTSService'
import { storage } from '../storage'
import { useNavigationStore } from '../stores/navigationStore'
import { usePageButtons } from '../hooks/usePageButtons'

export function CommunicationScreen() {
  const [ready, setReady] = useState(false)
  const currentPageId = useNavigationStore((s) => s.currentPageId)
  const setActivePageSet = useNavigationStore((s) => s.setActivePageSet)
  const { page, buttons } = usePageButtons(currentPageId)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await storage.init()
      const pageSetId = await seedIfNeeded(storage)
      const pageSet = await storage.getPageSet(pageSetId)
      if (cancelled || !pageSet) return
      setActivePageSet(pageSet.id, pageSet.rootPageId)
      setReady(true)
      ttsService.init()
    })()
    return () => {
      cancelled = true
    }
  }, [setActivePageSet])

  if (!ready || !page) {
    return <SafeAreaView style={styles.screen} />
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* §10.4: first touch anywhere warms the TTS engine so the first
          real utterance isn't delayed */}
      <View style={styles.content} onTouchStart={() => ttsService.warmUp()}>
        <TopBar pageName={page.name} />
        <MessageBar />
        <SymbolGrid
          rows={page.rows}
          columns={page.columns}
          buttons={buttons}
          onButtonPress={executeButtonActions}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
})
