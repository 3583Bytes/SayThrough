import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as DocumentPicker from 'expo-document-picker'
import { useEffect, useState } from 'react'
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import type * as Speech from 'expo-speech'
import type { RootStackParamList } from '../../App'
import { UI_COLORS } from '../constants/colors'
import { restoreBuiltInPageSets } from '../data/seedCoreVocabulary'
import { exportPageSet, importPageSet } from '../services/OBFService'
import {
  getInstallState,
  onInstallAvailable,
  promptInstall,
  type InstallState,
} from '../services/pwa'
import { ttsService } from '../services/TTSService'
import { rankVoices } from '../services/voiceSelection'
import { storage } from '../storage'
import { useEditStore } from '../stores/editStore'
import { useNavigationStore } from '../stores/navigationStore'
import { useUserStore } from '../stores/userStore'
import type { PageSet, WordList } from '../types/models'
import { generatePinSalt, hashPin } from '../utils/pin'
import { uuid } from '../utils/uuid'

const PREVIEW_TEXT = 'Hi! This is what I sound like.'

const RATE_PRESETS: Array<[string, number]> = [
  ['Slow', 0.7],
  ['Normal', 0.9],
  ['Fast', 1.1],
]
const PITCH_PRESETS: Array<[string, number]> = [
  ['Low', 0.8],
  ['Normal', 1.0],
  ['High', 1.2],
]
const HOLD_PRESETS: Array<[string, number]> = [
  ['Off', 0],
  ['0.3s', 300],
  ['0.6s', 600],
  ['1s', 1000],
]
const TEXT_SCALES: Array<[string, number]> = [
  ['A−', 0.85],
  ['A', 1],
  ['A+', 1.2],
  ['A++', 1.4],
]

// §5.8 — reachable only via edit mode. Access-method, display, filter,
// tracking, and backup sections arrive with their features.
export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const activeUser = useUserStore((s) => s.activeUser)
  const users = useUserStore((s) => s.users)
  const updateActiveUser = useUserStore((s) => s.updateActiveUser)

  const [voices, setVoices] = useState<Speech.Voice[]>([])
  const [pageSets, setPageSets] = useState<PageSet[]>([])
  const [name, setName] = useState(activeUser?.name ?? '')
  const [newUserName, setNewUserName] = useState('')
  const [pinModalVisible, setPinModalVisible] = useState(false)
  const [wordLists, setWordLists] = useState<WordList[]>([])
  const [newListName, setNewListName] = useState('')
  const [installState, setInstallState] = useState<InstallState>(getInstallState())

  useEffect(() => {
    onInstallAvailable(() => setInstallState(getInstallState()))
  }, [])

  useEffect(() => {
    if (activeUser) storage.getWordLists(activeUser.id).then(setWordLists)
  }, [activeUser?.id])

  useEffect(() => {
    ttsService.init().then(() => {
      // §10.2 ranking: novelty voices excluded, quality + local first
      setVoices(
        rankVoices(ttsService.getVoices(), activeUser?.language ?? 'en').slice(0, 12),
      )
    })
    storage.getPageSets().then(setPageSets)
  }, [activeUser?.language])

  if (!activeUser) return null

  const switchUser = async (userId: string) => {
    await useUserStore.getState().setActiveUser(userId)
    const user = useUserStore.getState().activeUser
    if (!user) return
    const pageSet = await storage.getPageSet(user.activePageSetId)
    if (pageSet) {
      useNavigationStore.getState().setActivePageSet(pageSet.id, pageSet.rootPageId)
    }
    setName(user.name)
  }

  const addUser = async () => {
    const trimmed = newUserName.trim()
    if (!trimmed || pageSets.length === 0) return
    await useUserStore.getState().createUser(trimmed, pageSets[0].id)
    await switchUser(useUserStore.getState().activeUser!.id)
    setNewUserName('')
  }

  const selectPageSet = async (pageSet: PageSet) => {
    await updateActiveUser({ activePageSetId: pageSet.id })
    useNavigationStore.getState().setActivePageSet(pageSet.id, pageSet.rootPageId)
  }

  // §14 — web implementation; native paths (expo-file-system/-sharing)
  // arrive with the Phase 2 builds
  const [backupStatus, setBackupStatus] = useState<string | undefined>()

  const exportActive = async () => {
    if (Platform.OS !== 'web') return
    setBackupStatus('Exporting…')
    await storage.setMeta('lastObzExportAt', String(Date.now())) // §12.5
    const blob = await exportPageSet(activeUser.activePageSetId)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'saythrough-pageset.obz'
    anchor.click()
    URL.revokeObjectURL(url)
    setBackupStatus('Exported.')
  }

  const [restoreArmed, setRestoreArmed] = useState(false)

  // Safety net: rebuild built-in sets from seed, keep user content
  const restoreBuiltIns = async () => {
    if (!restoreArmed) {
      setRestoreArmed(true)
      setBackupStatus(
        'This rebuilds Core Vocabulary and Quick Phrases from scratch — ' +
          'your own pages and profiles are kept. Tap again to confirm.',
      )
      return
    }
    setRestoreArmed(false)
    setBackupStatus('Restoring…')
    const coreId = await restoreBuiltInPageSets(storage)
    await useUserStore.getState().load()
    const user = useUserStore.getState().activeUser
    const pageSet = await storage.getPageSet(user?.activePageSetId ?? coreId)
    if (pageSet) {
      useNavigationStore.getState().setActivePageSet(pageSet.id, pageSet.rootPageId)
    }
    setPageSets(await storage.getPageSets())
    setBackupStatus('Built-in page sets restored.')
  }

  const importObz = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: false,
    })
    if (result.canceled || !result.assets?.[0]) return
    setBackupStatus('Importing…')
    try {
      const response = await fetch(result.assets[0].uri)
      const imported = await importPageSet(await response.arrayBuffer())
      setPageSets(await storage.getPageSets())
      setBackupStatus(`Imported "${imported.name}" — select it under Vocabulary.`)
    } catch (error) {
      setBackupStatus(`Import failed: ${String(error)}`)
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to communication"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* 1. Profile */}
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            onEndEditing={() => name.trim() && updateActiveUser({ name: name.trim() })}
            onBlur={() => name.trim() && updateActiveUser({ name: name.trim() })}
            style={styles.input}
            accessibilityLabel="Profile name"
          />
          <Text style={styles.fieldLabel}>Switch profile</Text>
          <View style={styles.chipRow}>
            {users.map((user) => (
              <Chip
                key={user.id}
                label={user.name}
                selected={user.id === activeUser.id}
                onPress={() => switchUser(user.id)}
              />
            ))}
          </View>
          <View style={styles.addRow}>
            <TextInput
              value={newUserName}
              onChangeText={setNewUserName}
              placeholder="New profile name"
              style={[styles.input, styles.addInput]}
              accessibilityLabel="New profile name"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add profile"
              onPress={addUser}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </Pressable>
          </View>
        </View>

        {/* 2. Speech */}
        <Text style={styles.sectionTitle}>Speech</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Voice</Text>
          {voices.map((voice) => (
            <View key={voice.identifier} style={styles.voiceRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Select voice ${voice.name}`}
                onPress={() => updateActiveUser({ ttsVoiceId: voice.identifier })}
                style={styles.voiceSelect}
              >
                <Text style={styles.voiceRadio}>
                  {activeUser.ttsVoiceId === voice.identifier ? '◉' : '○'}
                </Text>
                <Text style={styles.voiceName} numberOfLines={1}>
                  {voice.name}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Preview voice ${voice.name}`}
                onPress={() =>
                  ttsService.speak(PREVIEW_TEXT, { voiceId: voice.identifier })
                }
                style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}
              >
                <Text style={styles.previewText}>▶</Text>
              </Pressable>
            </View>
          ))}
          {voices.length === 0 && (
            <Text style={styles.hint}>No voices reported by this device yet.</Text>
          )}

          <Text style={styles.fieldLabel}>Speed</Text>
          <View style={styles.chipRow}>
            {RATE_PRESETS.map(([label, value]) => (
              <Chip
                key={label}
                label={label}
                selected={Math.abs(activeUser.ttsRate - value) < 0.01}
                onPress={() => updateActiveUser({ ttsRate: value })}
              />
            ))}
          </View>

          <Text style={styles.fieldLabel}>Pitch</Text>
          <View style={styles.chipRow}>
            {PITCH_PRESETS.map(([label, value]) => (
              <Chip
                key={label}
                label={label}
                selected={Math.abs(activeUser.ttsPitch - value) < 0.01}
                onPress={() => updateActiveUser({ ttsPitch: value })}
              />
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Speak each word when tapped</Text>
            <Switch
              value={activeUser.speakOnSelect}
              onValueChange={(value) => updateActiveUser({ speakOnSelect: value })}
              accessibilityLabel="Speak on select"
            />
          </View>
        </View>

        {/* 3. Access Method (touch accommodations — AM-01) */}
        <Text style={styles.sectionTitle}>Access Method</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Hold to activate</Text>
          <View style={styles.chipRow}>
            {HOLD_PRESETS.map(([label, value]) => (
              <Chip
                key={label}
                label={label}
                selected={(activeUser.touchHoldDuration ?? 0) === value}
                onPress={() => updateActiveUser({ touchHoldDuration: value })}
              />
            ))}
          </View>
          <Text style={styles.fieldLabel}>Ignore repeat taps for</Text>
          <View style={styles.chipRow}>
            {HOLD_PRESETS.map(([label, value]) => (
              <Chip
                key={label}
                label={label}
                selected={(activeUser.touchDebounce ?? 0) === value}
                onPress={() => updateActiveUser({ touchDebounce: value })}
              />
            ))}
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              Ignore second touch while pressing (palm guard)
            </Text>
            <Switch
              value={activeUser.ignoreSecondTouch ?? false}
              onValueChange={(value) => updateActiveUser({ ignoreSecondTouch: value })}
              accessibilityLabel="Ignore second touch"
            />
          </View>
          <Text style={styles.hint}>
            Dwell and switch scanning arrive in a later release.
          </Text>
        </View>

        {/* 3b. Display (§6.1 layout preferences) */}
        <Text style={styles.sectionTitle}>Display</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Message bar position</Text>
          <View style={styles.chipRow}>
            <Chip
              label="Top"
              selected={(activeUser.messageBarPosition ?? 'top') === 'top'}
              onPress={() => updateActiveUser({ messageBarPosition: 'top' })}
            />
            <Chip
              label="Bottom (easier reach)"
              selected={activeUser.messageBarPosition === 'bottom'}
              onPress={() => updateActiveUser({ messageBarPosition: 'bottom' })}
            />
          </View>
          <Text style={styles.fieldLabel}>Space between buttons</Text>
          <View style={styles.chipRow}>
            {(['compact', 'normal', 'wide'] as const).map((gap) => (
              <Chip
                key={gap}
                label={gap[0].toUpperCase() + gap.slice(1)}
                selected={(activeUser.buttonGap ?? 'normal') === gap}
                onPress={() => updateActiveUser({ buttonGap: gap })}
              />
            ))}
          </View>
          <Text style={styles.fieldLabel}>Button text size</Text>
          <View style={styles.chipRow}>
            {TEXT_SCALES.map(([label, value]) => (
              <Chip
                key={label}
                label={label}
                selected={(activeUser.labelTextScale ?? 1) === value}
                onPress={() => updateActiveUser({ labelTextScale: value })}
              />
            ))}
          </View>
        </View>

        {/* 4. Vocabulary */}
        <Text style={styles.sectionTitle}>Vocabulary</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Active page set</Text>
          <View style={styles.chipRow}>
            {pageSets.map((pageSet) => (
              <Chip
                key={pageSet.id}
                label={pageSet.name}
                selected={pageSet.id === activeUser.activePageSetId}
                onPress={() => selectPageSet(pageSet)}
              />
            ))}
          </View>
        </View>

        {/* 4b. Vocabulary Filter (§4.8) */}
        <Text style={styles.sectionTitle}>Vocabulary Filter</Text>
        <View style={styles.card}>
          <Text style={styles.hint}>
            Limit which words are active during therapy. Words not in the
            list stay visible (so a partner can model) but don't respond.
          </Text>
          {wordLists.length > 0 && <Text style={styles.fieldLabel}>Word lists</Text>}
          <View style={styles.chipRow}>
            {wordLists.map((list) => (
              <Chip
                key={list.id}
                label={list.name}
                selected={list.id === activeUser.activeWordListId}
                onPress={() => updateActiveUser({ activeWordListId: list.id })}
              />
            ))}
          </View>
          {activeUser.activeWordListId && (
            <View style={styles.chipRow}>
              <Chip
                label="Select words (tap them in the grid)"
                selected={false}
                onPress={() => {
                  useEditStore.getState().enterEditMode()
                  useEditStore
                    .getState()
                    .setWordListEditing(activeUser.activeWordListId!)
                  navigation.goBack()
                }}
              />
              <Chip
                label="Delete list"
                selected={false}
                onPress={async () => {
                  await storage.deleteWordList(activeUser.activeWordListId!)
                  await updateActiveUser({
                    activeWordListId: undefined,
                    filterEnabled: false,
                  })
                  setWordLists(await storage.getWordLists(activeUser.id))
                }}
              />
            </View>
          )}
          <View style={styles.addRow}>
            <TextInput
              value={newListName}
              onChangeText={setNewListName}
              placeholder="New list name (e.g. Week 1 Words)"
              style={[styles.input, styles.addInput]}
              accessibilityLabel="New word list name"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add word list"
              onPress={async () => {
                const trimmed = newListName.trim()
                if (!trimmed) return
                const now = Date.now()
                const list: WordList = {
                  id: uuid(),
                  userId: activeUser.id,
                  name: trimmed,
                  createdAt: now,
                  updatedAt: now,
                }
                await storage.createWordList(list)
                await updateActiveUser({ activeWordListId: list.id })
                setWordLists(await storage.getWordLists(activeUser.id))
                setNewListName('')
              }}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </Pressable>
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Filter on (also in top bar: ⊘)</Text>
            <Switch
              value={activeUser.filterEnabled ?? false}
              onValueChange={(value) => updateActiveUser({ filterEnabled: value })}
              accessibilityLabel="Vocabulary filter enabled"
            />
          </View>
        </View>

        {/* 5. Security */}
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.card}>
          <Text style={styles.hint}>
            The caregiver PIN protects edit mode and settings. It is
            child-proofing, not security.
          </Text>
          <View style={styles.chipRow}>
            <Chip
              label={activeUser.editPinHash ? 'Change PIN' : 'Set PIN'}
              selected={false}
              onPress={() => setPinModalVisible(true)}
            />
            {activeUser.editPinHash && (
              <Chip
                label="Remove PIN"
                selected={false}
                onPress={() =>
                  updateActiveUser({ editPinHash: undefined, editPinSalt: undefined })
                }
              />
            )}
          </View>
        </View>

        {/* 5b. Data Tracking (§4.13 — consent-gated, DT-05) */}
        <Text style={styles.sectionTitle}>Data Tracking</Text>
        <View style={styles.card}>
          <Text style={styles.hint}>
            Off by default. When a caregiver turns it on, button presses and
            spoken messages are recorded ON THIS DEVICE ONLY — nothing is
            sent anywhere. SLPs use this to document progress.
          </Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Track communication data</Text>
            <Switch
              value={activeUser.trackingEnabled ?? false}
              onValueChange={(value) => updateActiveUser({ trackingEnabled: value })}
              accessibilityLabel="Data tracking enabled"
            />
          </View>
          <View style={styles.chipRow}>
            <Chip
              label="View report"
              selected={false}
              onPress={() => navigation.navigate('TrackingReport')}
            />
          </View>
        </View>

        {/* 6. Backup & Restore */}
        <Text style={styles.sectionTitle}>Backup & Restore</Text>
        <View style={styles.card}>
          <Text style={styles.hint}>
            Open Board Format (.obz) — works with CoughDrop, TD Snap, and
            other AAC apps. Back up regularly: browser storage can be
            evicted.
          </Text>
          <View style={styles.chipRow}>
            <Chip
              label="Export active page set (.obz)"
              selected={false}
              onPress={exportActive}
            />
            <Chip label="Import .obz" selected={false} onPress={importObz} />
            <Chip
              label={restoreArmed ? 'Tap again to restore' : 'Restore built-in page sets'}
              selected={false}
              onPress={restoreBuiltIns}
            />
          </View>
          {backupStatus ? <Text style={styles.hint}>{backupStatus}</Text> : null}
        </View>

        {/* 6b. Install (§12.6) */}
        {installState !== 'unavailable' && (
          <>
            <Text style={styles.sectionTitle}>Install</Text>
            <View style={styles.card}>
              {installState === 'installed' && (
                <Text style={styles.hint}>
                  Installed ✓ — SayThrough opens full-screen and works offline.
                </Text>
              )}
              {installState === 'installable' && (
                <>
                  <Text style={styles.hint}>
                    Install SayThrough to the home screen: it opens like a
                    regular app, works offline, and the browser protects its
                    storage better.
                  </Text>
                  <View style={styles.chipRow}>
                    <Chip
                      label="Install app"
                      selected={false}
                      onPress={async () => {
                        await promptInstall()
                        setInstallState(getInstallState())
                      }}
                    />
                  </View>
                </>
              )}
              {installState === 'ios-instructions' && (
                <Text style={styles.hint}>
                  To install on iPad/iPhone: in Safari, tap Share (□↑) →
                  "Add to Home Screen". SayThrough will open full-screen and
                  work offline.
                </Text>
              )}
            </View>
          </>
        )}

        {/* 7. About */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <Text style={styles.hint}>
            SayThrough — free, open-source AAC. Application code is MIT
            licensed.{'\n\n'}
            Pictographic symbols © Government of Aragón (Spain), created by
            Sergio Palao for ARASAAC (https://arasaac.org), distributed under
            Creative Commons BY-NC-SA 4.0.{'\n'}
            Mulberry Symbols © Steve Lee, CC BY-SA 4.0.
          </Text>
        </View>
      </ScrollView>

      <PinSetupModal
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
        onSave={async (pin) => {
          const salt = generatePinSalt()
          const hash = await hashPin(pin, salt)
          await updateActiveUser({ editPinHash: hash, editPinSalt: salt })
          setPinModalVisible(false)
        }}
      />
    </SafeAreaView>
  )
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  )
}

function PinSetupModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean
  onClose: () => void
  onSave: (pin: string) => void
}) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | undefined>()

  const save = () => {
    if (!/^\d{4,8}$/.test(pin)) {
      setError('PIN must be 4–8 digits')
      return
    }
    if (pin !== confirm) {
      setError('PINs do not match')
      return
    }
    onSave(pin)
    setPin('')
    setConfirm('')
    setError(undefined)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Set caregiver PIN</Text>
          <TextInput
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            placeholder="New PIN"
            style={styles.input}
            accessibilityLabel="New PIN"
          />
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            placeholder="Confirm PIN"
            style={styles.input}
            accessibilityLabel="Confirm PIN"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.chipRow}>
            <Chip label="Cancel" selected={false} onPress={onClose} />
            <Chip label="Save PIN" selected onPress={save} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: UI_COLORS.barBackground,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.barBorder,
    paddingHorizontal: 8,
  },
  backButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSpacer: {
    minWidth: 60,
  },
  body: {
    padding: 16,
    gap: 8,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UI_COLORS.barBorder,
    padding: 14,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: UI_COLORS.buttonBorder,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: UI_COLORS.barBorder,
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addInput: {
    flex: 1,
  },
  addButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: UI_COLORS.speakGreen,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceSelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  voiceRadio: {
    fontSize: 16,
    color: '#1976D2',
  },
  voiceName: {
    fontSize: 14,
    flexShrink: 1,
  },
  previewButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: UI_COLORS.barBorder,
  },
  previewText: {
    fontSize: 14,
    color: UI_COLORS.speakGreen,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  switchLabel: {
    fontSize: 14,
    flexShrink: 1,
  },
  hint: {
    fontSize: 13,
    color: '#777777',
    lineHeight: 19,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    gap: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  error: {
    color: UI_COLORS.clearRed,
    textAlign: 'center',
    fontSize: 13,
  },
  pressed: {
    opacity: 0.7,
  },
})
