import { useEffect } from 'react'
import { SafeAreaView, StyleSheet, View } from 'react-native'
import { MessageBar } from '../components/communication/MessageBar'
import { SymbolGrid } from '../components/communication/SymbolGrid'
import {
  CORE_PAGE_BUTTONS,
  GRID_COLUMNS,
  GRID_ROWS,
  type GridButton,
} from '../data/corePage'
import { ttsService } from '../services/TTSService'
import { useMessageStore } from '../stores/messageStore'

export function CommunicationScreen() {
  const appendToken = useMessageStore((s) => s.appendToken)

  useEffect(() => {
    ttsService.init()
  }, [])

  const handleButtonPress = (button: GridButton) => {
    appendToken(button.label)
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* §10.4: first touch anywhere warms the TTS engine so the first
          real utterance isn't delayed */}
      <View style={styles.content} onTouchStart={() => ttsService.warmUp()}>
        <MessageBar />
        <SymbolGrid
          rows={GRID_ROWS}
          columns={GRID_COLUMNS}
          buttons={CORE_PAGE_BUTTONS}
          onButtonPress={handleButtonPress}
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
