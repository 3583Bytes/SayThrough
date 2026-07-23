import { useEffect, useState } from 'react'
import { SafeAreaView, StyleSheet, View } from 'react-native'
import { MessageBar } from '../components/communication/MessageBar'
import { SymbolGrid } from '../components/communication/SymbolGrid'
import { TopBar } from '../components/communication/TopBar'
import { PinEntryModal } from '../components/common/PinEntryModal'
import { ButtonEditorPanel } from '../components/edit/ButtonEditorPanel'
import { EditBar } from '../components/edit/EditBar'
import { UI_COLORS } from '../constants/colors'
import { seedIfNeeded } from '../data/seedCoreVocabulary'
import { usePageButtons } from '../hooks/usePageButtons'
import { executeButtonActions } from '../services/actionExecutor'
import { ttsService } from '../services/TTSService'
import { storage } from '../storage'
import { useEditStore } from '../stores/editStore'
import { useNavigationStore } from '../stores/navigationStore'
import type { Button } from '../types/models'
import { verifyPin } from '../utils/pin'
import { uuid } from '../utils/uuid'

export function CommunicationScreen() {
  const [ready, setReady] = useState(false)
  const [pinModalVisible, setPinModalVisible] = useState(false)
  const [pinError, setPinError] = useState<string | undefined>()

  const currentPageId = useNavigationStore((s) => s.currentPageId)
  const setActivePageSet = useNavigationStore((s) => s.setActivePageSet)
  const { page, buttons, refresh } = usePageButtons(currentPageId)

  const isEditMode = useEditStore((s) => s.isEditMode)
  const selectedButtonId = useEditStore((s) => s.selectedButtonId)
  const isEditorOpen = useEditStore((s) => s.isEditorOpen)
  const edit = useEditStore.getState

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

  // §13.1: no PIN configured → edit mode opens directly; PIN-setting UI
  // arrives with the Settings screen
  const requestEditAccess = async () => {
    const [hash, salt] = await Promise.all([
      storage.getMeta('editPinHash'),
      storage.getMeta('editPinSalt'),
    ])
    if (!hash || !salt) {
      edit().enterEditMode()
      return
    }
    setPinError(undefined)
    setPinModalVisible(true)
  }

  const handlePinSubmit = async (pin: string) => {
    const [hash, salt] = await Promise.all([
      storage.getMeta('editPinHash'),
      storage.getMeta('editPinSalt'),
    ])
    if (hash && salt && (await verifyPin(pin, salt, hash))) {
      setPinModalVisible(false)
      edit().enterEditMode()
    } else {
      setPinError('Wrong PIN — try again')
    }
  }

  const handleButtonPress = (button: Button) => {
    if (!isEditMode) {
      executeButtonActions(button)
      return
    }
    // edit mode: first tap selects, tapping the selected button opens
    // the editor (§6.1)
    if (selectedButtonId === button.id) {
      edit().openEditor()
    } else {
      edit().selectButton(button.id)
      edit().closeEditor()
    }
  }

  const handleEmptyCellPress = async (row: number, column: number) => {
    if (!page) return
    const now = Date.now()
    const newButton: Button = {
      id: uuid(),
      pageId: page.id,
      row,
      column,
      rowSpan: 1,
      columnSpan: 1,
      label: '',
      backgroundColor: '#FFFFFF',
      borderColor: UI_COLORS.buttonBorder,
      borderWidth: 1,
      labelColor: UI_COLORS.label,
      labelFontSize: 14,
      labelFontWeight: 'bold',
      symbolScale: 0.65,
      isHidden: false,
      isNavigationButton: false,
      actions: [{ type: 'append_to_message' }],
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    }
    await storage.createButton(newButton)
    refresh()
    edit().selectButton(newButton.id)
    edit().openEditor()
  }

  const selectedButton = buttons.find((b) => b.id === selectedButtonId)

  const handleEditorSave = async (
    changes: Pick<Button, 'label' | 'backgroundColor'>,
  ) => {
    if (!selectedButton) return
    await storage.updateButton({
      ...selectedButton,
      ...changes,
      updatedAt: Date.now(),
    })
    refresh()
  }

  const handleEditorDelete = async () => {
    if (!selectedButton) return
    await storage.deleteButton(selectedButton.id)
    edit().closeEditor()
    edit().selectButton(null)
    refresh()
  }

  if (!ready || !page) {
    return <SafeAreaView style={styles.screen} />
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* §10.4: first touch anywhere warms the TTS engine */}
      <View style={styles.content} onTouchStart={() => ttsService.warmUp()}>
        {isEditMode ? (
          <EditBar pageName={page.name} onDone={() => edit().exitEditMode()} />
        ) : (
          <TopBar pageName={page.name} onEditPress={requestEditAccess} />
        )}
        {/* §5.6: message bar hidden in edit mode */}
        {!isEditMode && <MessageBar />}
        <SymbolGrid
          rows={page.rows}
          columns={page.columns}
          buttons={buttons}
          isEditMode={isEditMode}
          selectedButtonId={selectedButtonId}
          onButtonPress={handleButtonPress}
          onEmptyCellPress={handleEmptyCellPress}
        />
        {isEditMode && isEditorOpen && selectedButton && (
          <ButtonEditorPanel
            button={selectedButton}
            onSave={handleEditorSave}
            onDelete={handleEditorDelete}
            onClose={() => edit().closeEditor()}
          />
        )}
      </View>
      <PinEntryModal
        visible={pinModalVisible}
        onSubmit={handlePinSubmit}
        onCancel={() => setPinModalVisible(false)}
        error={pinError}
      />
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
