import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useState } from 'react'
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import type { RootStackParamList } from '../../App'
import { KeyboardView } from '../components/communication/KeyboardView'
import { MessageBar } from '../components/communication/MessageBar'
import { SymbolGrid } from '../components/communication/SymbolGrid'
import { Toolbar } from '../components/communication/Toolbar'
import { TopBar } from '../components/communication/TopBar'
import { PinEntryModal } from '../components/common/PinEntryModal'
import { ButtonEditorPanel } from '../components/edit/ButtonEditorPanel'
import { EditBar } from '../components/edit/EditBar'
import { UI_COLORS } from '../constants/colors'
import { usePageButtons } from '../hooks/usePageButtons'
import { executeButtonActions } from '../services/actionExecutor'
import { ttsService } from '../services/TTSService'
import { storage } from '../storage'
import { useEditStore } from '../stores/editStore'
import { useNavigationStore } from '../stores/navigationStore'
import { useUserStore } from '../stores/userStore'
import type { Button } from '../types/models'
import { verifyPin } from '../utils/pin'
import { uuid } from '../utils/uuid'

export function CommunicationScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [pinModalVisible, setPinModalVisible] = useState(false)
  const [pinError, setPinError] = useState<string | undefined>()
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [showBackupNudge, setShowBackupNudge] = useState(false)

  const currentPageId = useNavigationStore((s) => s.currentPageId)
  const { page, buttons, refresh } = usePageButtons(currentPageId)

  const isEditMode = useEditStore((s) => s.isEditMode)
  const selectedButtonId = useEditStore((s) => s.selectedButtonId)
  const isEditorOpen = useEditStore((s) => s.isEditorOpen)
  const edit = useEditStore.getState

  // §12.5: nudge on edit-mode entry when there are unexported changes
  // and the last export is >30 days old (or never) — never in use mode
  const checkBackupNudge = async () => {
    const [changedAt, exportedAt] = await Promise.all([
      storage.getMeta('vocabChangedAt'),
      storage.getMeta('lastObzExportAt'),
    ])
    if (!changedAt) return
    const exported = exportedAt ? Number(exportedAt) : 0
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    setShowBackupNudge(
      Number(changedAt) > exported && Date.now() - exported > thirtyDays,
    )
  }

  const markVocabularyChanged = () =>
    storage.setMeta('vocabChangedAt', String(Date.now()))

  const enterEdit = () => {
    edit().enterEditMode()
    checkBackupNudge()
  }

  // §13.1: no PIN configured → edit mode opens directly
  const requestEditAccess = () => {
    const user = useUserStore.getState().activeUser
    if (!user?.editPinHash || !user.editPinSalt) {
      enterEdit()
      return
    }
    setPinError(undefined)
    setPinModalVisible(true)
  }

  const handlePinSubmit = async (pin: string) => {
    const user = useUserStore.getState().activeUser
    if (
      user?.editPinHash &&
      user.editPinSalt &&
      (await verifyPin(pin, user.editPinSalt, user.editPinHash))
    ) {
      setPinModalVisible(false)
      enterEdit()
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
    markVocabularyChanged()
    refresh()
    edit().selectButton(newButton.id)
    edit().openEditor()
  }

  // Toolbar section jumps (session-level; the profile default is
  // unchanged — that lives in Settings → Vocabulary)
  const jumpToPageSet = async (metaKey: string) => {
    const pageSetId = await storage.getMeta(metaKey)
    const pageSet = pageSetId ? await storage.getPageSet(pageSetId) : null
    if (pageSet) {
      useNavigationStore.getState().setActivePageSet(pageSet.id, pageSet.rootPageId)
    }
    setKeyboardOpen(false)
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
    markVocabularyChanged()
    refresh()
  }

  const handleEditorDelete = async () => {
    if (!selectedButton) return
    await storage.deleteButton(selectedButton.id)
    markVocabularyChanged()
    edit().closeEditor()
    edit().selectButton(null)
    refresh()
  }

  if (!page) {
    return <SafeAreaView style={styles.screen} />
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* §10.4: first touch anywhere warms the TTS engine */}
      <View style={styles.content} onTouchStart={() => ttsService.warmUp()}>
        {isEditMode ? (
          <EditBar
            pageName={page.name}
            onDone={() => edit().exitEditMode()}
            onSettings={() => navigation.navigate('Settings')}
          />
        ) : (
          <TopBar pageName={page.name} onEditPress={requestEditAccess} />
        )}
        {isEditMode && showBackupNudge && (
          <View style={styles.nudge}>
            <Text style={styles.nudgeText}>
              Your vocabulary has unsaved changes — back up now?
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back up now"
              onPress={() => {
                setShowBackupNudge(false)
                navigation.navigate('Settings')
              }}
            >
              <Text style={styles.nudgeAction}>Back up now</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss backup reminder"
              onPress={() => setShowBackupNudge(false)}
            >
              <Text style={styles.nudgeDismiss}>✕</Text>
            </Pressable>
          </View>
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
        {!isEditMode && keyboardOpen && <KeyboardView />}
        {!isEditMode && page.showToolbar && (
          <Toolbar
            isKeyboardOpen={keyboardOpen}
            onCore={() => jumpToPageSet('coreVocabularySeeded')}
            onQuick={() => jumpToPageSet('quickPhrasesPageSetId')}
            onKeyboard={() => setKeyboardOpen((open) => !open)}
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
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E8F5E9',
    borderBottomWidth: 1,
    borderBottomColor: '#A5D6A7',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nudgeText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
  },
  nudgeAction: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2E7D32',
    textDecorationLine: 'underline',
  },
  nudgeDismiss: {
    fontSize: 14,
    color: '#2E7D32',
    padding: 4,
  },
})
