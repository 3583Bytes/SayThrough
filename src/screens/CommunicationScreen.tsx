import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { RootStackParamList } from '../../App'
import { KeyboardView } from '../components/communication/KeyboardView'
import {
  MessageBar,
  SCAN_BACKSPACE,
  SCAN_SPEAK,
} from '../components/communication/MessageBar'
import { SearchModal } from '../components/communication/SearchModal'
import { SymbolGrid } from '../components/communication/SymbolGrid'
import { Toolbar } from '../components/communication/Toolbar'
import { TopBar } from '../components/communication/TopBar'
import { WordFormsModal } from '../components/communication/WordFormsModal'
import { PinEntryModal } from '../components/common/PinEntryModal'
import {
  ButtonEditorPanel,
  type ButtonEditorChanges,
} from '../components/edit/ButtonEditorPanel'
import { EditBar } from '../components/edit/EditBar'
import { UI_COLORS } from '../constants/colors'
import { usePageButtons } from '../hooks/usePageButtons'
import { useScanning, type ScanItem } from '../hooks/useScanning'
import { useTheme } from '../hooks/useTheme'
import { executeButtonActions } from '../services/actionExecutor'
import { useMessageStore } from '../stores/messageStore'
import { wordForms } from '../services/morphology'
import { deletePageAndCleanLinks, renamePage } from '../services/pageService'
import { ttsService } from '../services/TTSService'
import { storage } from '../storage'
import { useEditStore } from '../stores/editStore'
import { useNavigationStore } from '../stores/navigationStore'
import { GUEST_USER_ID, useUserStore } from '../stores/userStore'
import {
  coreColumnsForPageSet,
  levelOfButton,
} from '../data/seedCoreVocabulary'
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
  const [searchVisible, setSearchVisible] = useState(false)
  const [pageMenuVisible, setPageMenuVisible] = useState(false)
  const [pageRenameText, setPageRenameText] = useState('')
  const [coreSetId, setCoreSetId] = useState<string | null>(null)
  const [quickSetId, setQuickSetId] = useState<string | null>(null)
  const [wordListIds, setWordListIds] = useState<Set<string>>(new Set())
  const [wordListName, setWordListName] = useState<string | undefined>()

  const currentPageId = useNavigationStore((s) => s.currentPageId)
  const flashButtonId = useNavigationStore((s) => s.flashButtonId)
  const { page, buttons: storedButtons, refresh } = usePageButtons(currentPageId)

  const isEditMode = useEditStore((s) => s.isEditMode)
  const selectedButtonId = useEditStore((s) => s.selectedButtonId)
  const isEditorOpen = useEditStore((s) => s.isEditorOpen)
  const wordListEditingId = useEditStore((s) => s.wordListEditingId)
  const canUndo = useEditStore((s) => s.undoStack.length > 0)
  const canRedo = useEditStore((s) => s.redoStack.length > 0)
  const edit = useEditStore.getState

  const activeUser = useUserStore((s) => s.activeUser)
  const isGuest = activeUser?.id === GUEST_USER_ID
  const theme = useTheme()
  const filterListId =
    wordListEditingId ??
    (activeUser?.filterEnabled ? activeUser.activeWordListId : undefined)

  // Load the relevant word list (for filtering in use mode, or badges
  // while selecting words in edit mode)
  useEffect(() => {
    if (!filterListId || !activeUser) {
      setWordListIds(new Set())
      setWordListName(undefined)
      return
    }
    let cancelled = false
    Promise.all([
      storage.getWordListButtonIds(filterListId),
      storage.getWordLists(activeUser.id),
    ]).then(([ids, lists]) => {
      if (cancelled) return
      setWordListIds(new Set(ids))
      setWordListName(lists.find((l) => l.id === filterListId)?.name)
    })
    return () => {
      cancelled = true
    }
  }, [filterListId, activeUser])

  // The persistent-core framing (§19.2) applies to any bundled core set and
  // its pages (incl. user-created ones, which share the set id) — not Quick
  // Phrases or blank sets. Width comes from the size's authored layout, since
  // each grid size has its own core region.
  useEffect(() => {
    storage.getMeta('coreVocabularySeeded').then(setCoreSetId)
    storage.getMeta('quickPhrasesPageSetId').then(setQuickSetId)
  }, [])
  const coreColumns = page ? coreColumnsForPageSet(page.pageSetId) : 0

  // §19 vocabulary level: hide words the user has not been introduced to yet,
  // by marking them hidden rather than removing them — that reuses the
  // existing isHidden semantics exactly, so they stay visible in edit mode and
  // drop out of the grid, the scan model and search together. Positions come
  // from the authored layout, so raising the level only un-hides cells and
  // never moves anything (§19.1).
  //
  // Undefined level means "show everything": profiles created before levels
  // existed must not silently lose words.
  const vocabularyLevel = activeUser?.vocabularyLevel ?? 3
  const buttons = useMemo(
    () =>
      storedButtons.map((button) =>
        levelOfButton(button.id) > vocabularyLevel
          ? { ...button, isHidden: true }
          : button,
      ),
    [storedButtons, vocabularyLevel],
  )

  // Toolbar "you are here": highlight the section for the active page set
  // (keyboard wins when open). User-created pages share the Core set id,
  // so they correctly read as Core.
  const activeSection = keyboardOpen
    ? 'keyboard'
    : page?.pageSetId === quickSetId
      ? 'quick'
      : page && coreColumnsForPageSet(page.pageSetId) > 0
        ? 'core'
        : null

  // §AM-05 switch scanning: build the scannable model (message actions
  // group + one group per grid row) and drive the highlight/selection.
  const speakMessage = useMessageStore((s) => s.speakMessage)
  const deleteLastToken = useMessageStore((s) => s.deleteLastToken)

  const scanGroups = useMemo<ScanItem[][]>(() => {
    if (!page) return []
    const groups: ScanItem[][] = []
    if (page.showMessageBar) {
      groups.push([
        { id: SCAN_SPEAK, label: 'Speak', activate: () => speakMessage() },
        { id: SCAN_BACKSPACE, label: 'Delete', activate: () => deleteLastToken() },
      ])
    }
    const visible = buttons.filter((b) => !b.isHidden)
    for (let r = 0; r < page.rows; r++) {
      const rowItems = visible
        .filter((b) => b.row === r)
        .sort((a, b) => a.column - b.column)
        .map<ScanItem>((b) => ({
          id: b.id,
          label: b.label,
          activate: () => executeButtonActions(b),
        }))
      if (rowItems.length) groups.push(rowItems)
    }
    return groups
  }, [page, buttons, speakMessage, deleteLastToken])

  // The keyboard runs its OWN scanning while it is open (§AM-05) — its keys,
  // prediction slots and buffer live inside KeyboardView, and the two scanners
  // are mutually exclusive on keyboardOpen, so they never run together.
  const scanningEnabled =
    !!page && !isEditMode && !keyboardOpen && activeUser?.accessMethod === 'scanning'

  const { highlightedIds: scanHighlightIds, select: scanSelect } = useScanning({
    enabled: scanningEnabled,
    groups: scanGroups,
    resetKey: currentPageId ?? '',
    mode: activeUser?.scanMode ?? 'auto',
    pattern: activeUser?.scanPattern ?? 'row-column',
    speed: activeUser?.scanSpeed ?? 1500,
    auditory: activeUser?.scanAuditory ?? false,
  })

  // §12.4: clear the search-jump flash after a short pulse
  useEffect(() => {
    if (!flashButtonId) return
    const timer = setTimeout(
      () => useNavigationStore.getState().flashButton(null),
      1600,
    )
    return () => clearTimeout(timer)
  }, [flashButtonId])

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

  // §Tier-1 word forms: long-press a word button (use mode) → pick an
  // inflection. Disabled when hold-to-activate is on (that gesture already
  // means "select"), and only for word buttons that have alternate forms.
  const [formsButton, setFormsButton] = useState<Button | null>(null)
  const holdToActivate = (activeUser?.touchHoldDuration ?? 0) > 0

  const handleButtonLongPress = (button: Button) => {
    if (scanningEnabled) return
    const isWord = button.actions.some((a) => a.type === 'append_to_message')
    if (!isWord) return
    if (wordForms(button.label, button.partOfSpeech).length > 1) {
      setFormsButton(button)
    }
  }

  const handleButtonPress = async (button: Button) => {
    // §AM-05: in scanning mode a tap anywhere is the "select" switch —
    // it activates the current scan cursor, not the tapped button
    if (scanningEnabled) {
      scanSelect()
      return
    }
    if (!isEditMode) {
      executeButtonActions(button)
      return
    }
    // §12.2: while selecting words for a list, taps toggle membership
    if (wordListEditingId) {
      const next = new Set(wordListIds)
      if (next.has(button.id)) {
        next.delete(button.id)
        await storage.removeWordFromList(wordListEditingId, button.id)
      } else {
        next.add(button.id)
        await storage.addWordToList(wordListEditingId, button.id)
      }
      setWordListIds(next)
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
    edit().pushEdit({ type: 'ADD_BUTTON', button: newButton })
    markVocabularyChanged()
    refresh()
    edit().selectButton(newButton.id)
    edit().openEditor()
  }

  const handleButtonMove = async (button: Button, toRow: number, toColumn: number) => {
    const target = buttons.find(
      (b) => b.row === toRow && b.column === toColumn && b.id !== button.id,
    )
    const now = Date.now()
    await storage.updateButton({ ...button, row: toRow, column: toColumn, updatedAt: now })
    if (target) {
      // §12.3: dropping on an occupied cell swaps the two buttons
      await storage.updateButton({
        ...target,
        row: button.row,
        column: button.column,
        updatedAt: now,
      })
    }
    edit().pushEdit({
      type: 'MOVE_BUTTON',
      moved: button,
      to: { row: toRow, column: toColumn },
      swapped: target,
    })
    markVocabularyChanged()
    refresh()
  }

  // Toolbar section jumps (session-level; the profile default is
  // unchanged — that lives in Settings → Vocabulary)
  // The user's own board. Resolving 'coreVocabularySeeded' here instead would
  // always land on the 5×6 set and throw a user of another grid size onto a
  // different layout — the exact thing motor planning cannot survive.
  const jumpToActivePageSet = async () => {
    const pageSetId = useUserStore.getState().activeUser?.activePageSetId
    const pageSet = pageSetId ? await storage.getPageSet(pageSetId) : null
    if (pageSet) {
      useNavigationStore.getState().setActivePageSet(pageSet.id, pageSet.rootPageId)
    }
    setKeyboardOpen(false)
  }

  const jumpToPageSet = async (metaKey: string) => {
    const pageSetId = await storage.getMeta(metaKey)
    const pageSet = pageSetId ? await storage.getPageSet(pageSetId) : null
    if (pageSet) {
      useNavigationStore.getState().setActivePageSet(pageSet.id, pageSet.rootPageId)
    }
    setKeyboardOpen(false)
  }

  const isRootPage = useNavigationStore.getState().rootPageId === currentPageId

  const handlePageRename = async () => {
    if (!page || !pageRenameText.trim()) return
    await renamePage(page, pageRenameText.trim())
    markVocabularyChanged()
    setPageMenuVisible(false)
    refresh()
  }

  const handlePageDelete = async () => {
    if (!page || isRootPage) return
    setPageMenuVisible(false)
    useNavigationStore.getState().navigateHome()
    await deletePageAndCleanLinks(page)
    markVocabularyChanged()
    refresh()
  }

  const selectedButton = buttons.find((b) => b.id === selectedButtonId)

  const handleEditorSave = async (changes: ButtonEditorChanges) => {
    if (!selectedButton) return
    const after = { ...selectedButton, ...changes, updatedAt: Date.now() }
    await storage.updateButton(after)
    edit().pushEdit({ type: 'UPDATE_BUTTON', before: selectedButton, after })
    markVocabularyChanged()
    refresh()
  }

  const handleEditorDelete = async () => {
    if (!selectedButton) return
    await storage.deleteButton(selectedButton.id)
    edit().pushEdit({ type: 'DELETE_BUTTON', button: selectedButton })
    markVocabularyChanged()
    edit().closeEditor()
    edit().selectButton(null)
    refresh()
  }

  const handleUndo = async () => {
    await edit().undo()
    refresh()
  }

  const handleRedo = async () => {
    await edit().redo()
    refresh()
  }

  if (!page) {
    return <SafeAreaView style={[styles.screen, { backgroundColor: theme.screen }]} />
  }

  return (
    <SafeAreaView
      testID="app-screen"
      style={[styles.screen, { backgroundColor: theme.screen }]}
    >
      {/* §10.4: first touch anywhere warms the TTS engine */}
      <View style={styles.content}>
        {isEditMode ? (
          <EditBar
            pageName={page.name}
            wordListName={wordListEditingId ? wordListName : undefined}
            onDone={() =>
              wordListEditingId
                ? edit().setWordListEditing(null) // back to normal edit mode
                : edit().exitEditMode()
            }
            onPageMenu={() => {
              setPageRenameText(page.name)
              setPageMenuVisible(true)
            }}
            onSettings={() => navigation.navigate('Settings')}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        ) : (
          <TopBar
            pageName={page.name}
            editHidden={isGuest}
            onEditPress={requestEditAccess}
            onSearchPress={() => setSearchVisible(true)}
            filter={
              activeUser?.activeWordListId
                ? {
                    available: true,
                    enabled: activeUser.filterEnabled ?? false,
                    onToggle: () =>
                      useUserStore.getState().updateActiveUser({
                        filterEnabled: !(activeUser.filterEnabled ?? false),
                      }),
                  }
                : undefined
            }
          />
        )}
        {isGuest && (
          <View style={[styles.guestBanner, { backgroundColor: theme.accentSurface }]}>
            <Text style={[styles.guestText, { color: theme.accent }]}>
              Demo mode — nothing is saved.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Set up SayThrough"
              onPress={() => useUserStore.getState().endGuest()}
            >
              <Text style={[styles.guestAction, { color: theme.accent }]}>Set up SayThrough</Text>
            </Pressable>
          </View>
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
        {/* §5.6: message bar hidden in edit mode; position per profile */}
        {!isEditMode && activeUser?.messageBarPosition !== 'bottom' && (
          <MessageBar scanHighlightIds={scanHighlightIds} />
        )}
        <SymbolGrid
          rows={page.rows}
          columns={page.columns}
          buttons={buttons}
          coreColumns={coreColumns}
          isEditMode={isEditMode}
          selectedButtonId={selectedButtonId}
          flashButtonId={flashButtonId}
          gap={{ compact: 2, normal: 4, wide: 8 }[activeUser?.buttonGap ?? 'normal']}
          scanHighlightIds={scanHighlightIds}
          filterState={
            wordListEditingId
              ? { mode: 'editing', ids: wordListIds }
              : filterListId && !isEditMode
                ? { mode: 'filtering', ids: wordListIds }
                : undefined
          }
          onButtonPress={handleButtonPress}
          onButtonLongPress={
            !isEditMode && !holdToActivate ? handleButtonLongPress : undefined
          }
          onButtonMove={handleButtonMove}
          onEmptyCellPress={wordListEditingId ? undefined : handleEmptyCellPress}
        />
        {isEditMode && isEditorOpen && selectedButton && (
          <ButtonEditorPanel
            button={selectedButton}
            onSave={handleEditorSave}
            onDelete={handleEditorDelete}
            onClose={() => edit().closeEditor()}
          />
        )}
        {!isEditMode && activeUser?.messageBarPosition === 'bottom' && (
          <MessageBar scanHighlightIds={scanHighlightIds} />
        )}
        {!isEditMode && keyboardOpen && (
          <KeyboardView onClose={() => setKeyboardOpen(false)} />
        )}
        {!isEditMode && page.showToolbar && (
          <Toolbar
            activeSection={activeSection}
            onCore={() => jumpToActivePageSet()}
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
      <SearchModal visible={searchVisible} onClose={() => setSearchVisible(false)} />
      <WordFormsModal
        visible={!!formsButton}
        word={formsButton?.label ?? ''}
        pos={formsButton?.partOfSpeech}
        onPick={(value) => {
          if (formsButton) {
            useMessageStore.getState().appendToken(value, {
              symbolId: formsButton.symbolId,
              customSymbolUri: formsButton.customSymbolUri,
            })
          }
          setFormsButton(null)
        }}
        onClose={() => setFormsButton(null)}
      />
      <Modal
        visible={pageMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPageMenuVisible(false)}
      >
        <Pressable
          style={[styles.menuBackdrop, { backgroundColor: theme.backdrop }]}
          onPress={() => setPageMenuVisible(false)}
        >
          <Pressable
            style={[styles.menuCard, { backgroundColor: theme.surface }]}
            onPress={() => {}}
          >
            <Text style={[styles.menuTitle, { color: theme.text }]}>Page: {page.name}</Text>
            <TextInput
              value={pageRenameText}
              onChangeText={setPageRenameText}
              style={[styles.menuInput, { color: theme.text }]}
              accessibilityLabel="Page name"
              onSubmitEditing={handlePageRename}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Rename page"
              onPress={handlePageRename}
              style={({ pressed }) => [styles.menuButton, pressed && styles.menuPressed]}
            >
              <Text style={[styles.menuButtonText, { color: theme.text }]}>Rename</Text>
            </Pressable>
            {!isRootPage && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete page"
                onPress={handlePageDelete}
                style={({ pressed }) => [
                  styles.menuButton,
                  styles.menuDelete,
                  { borderColor: theme.danger },
                  pressed && styles.menuPressed,
                ]}
              >
                <Text style={[styles.menuDeleteText, { color: theme.danger }]}>
                  Delete page (buttons that open it become plain words)
                </Text>
              </Pressable>
            )}
            {isRootPage && (
              <Text style={[styles.menuHint, { color: theme.textMuted }]}>The home page cannot be deleted.</Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCard: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuInput: {
    borderWidth: 1,
    borderColor: UI_COLORS.buttonBorder,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  menuButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: UI_COLORS.barBorder,
    paddingHorizontal: 8,
  },
  menuDelete: {},
  menuButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuDeleteText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuHint: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  menuPressed: {
    opacity: 0.7,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#E3F2FD',
    borderBottomWidth: 1,
    borderBottomColor: '#90CAF9',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  guestText: {
    fontSize: 13,
    color: '#1565C0',
  },
  guestAction: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1565C0',
    textDecorationLine: 'underline',
  },
})
