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
import {
  levelCountForPageSet,
  restoreBuiltInPageSets,
} from '../data/seedCoreVocabulary'
import {
  createBackup,
  parseBackup,
  restoreBackup,
  serializeBackup,
} from '../services/backupService'
import { exportPageSet, importPageSet } from '../services/OBFService'
import { resetLearning } from '../services/predictionModel'
import {
  isUsageCountingEnabled,
  setUsageCountingEnabled,
} from '../services/usageCounter'
import {
  getInstallState,
  onInstallAvailable,
  promptInstall,
  type InstallState,
} from '../services/pwa'
import { enhancedBackend, ttsService } from '../services/TTSService'
import { rankVoices } from '../services/voiceSelection'
import { useT } from '../hooks/useT'
import { useTheme } from '../hooks/useTheme'
import { SUPPORTED_LANGUAGES, langCode, type StringKey } from '../i18n'
import { storage } from '../storage'
import { useEditStore } from '../stores/editStore'
import { useNavigationStore } from '../stores/navigationStore'
import { useUserStore } from '../stores/userStore'
import type { PageSet, WordList } from '../types/models'
import { generatePinSalt, hashPin } from '../utils/pin'
import { uuid } from '../utils/uuid'


// Presets carry a string KEY, not a label — they are rendered through the
// active profile's language like everything else on this screen.
const RATE_PRESETS: Array<[StringKey, number]> = [
  ['preset.slow', 0.7],
  ['preset.normal', 0.9],
  ['preset.fast', 1.1],
]
const PITCH_PRESETS: Array<[StringKey, number]> = [
  ['preset.low', 0.8],
  ['preset.normal', 1.0],
  ['preset.high', 1.2],
]
const DWELL_PRESETS: Array<[StringKey, number]> = [
  ['preset.d500', 500],
  ['preset.d1000', 1000],
  ['preset.d1500', 1500],
  ['preset.d2500', 2500],
]
const SCAN_SPEEDS: Array<[StringKey, number]> = [
  ['preset.scanSlow', 2500],
  ['preset.scanMedium', 1500],
  ['preset.scanFast', 1000],
]
const HOLD_PRESETS: Array<[StringKey, number]> = [
  ['preset.off', 0],
  ['preset.d300', 300],
  ['preset.d600', 600],
  ['preset.d1000', 1000],
]
// §19 — 3 (Full) is the default so existing profiles keep every word.
const VOCABULARY_LEVELS: Array<[StringKey, 1 | 2 | 3]> = [
  ['settings.levelBasic', 1],
  ['settings.levelIntermediate', 2],
  ['settings.levelFull', 3],
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
  const theme = useTheme()
  const t = useT()
  // themed style tokens applied across the repeated cards/labels/inputs
  const cardT = { backgroundColor: theme.surface, borderColor: theme.border }
  const textT = { color: theme.text }
  const mutedT = { color: theme.textMuted }
  const inputT = {
    backgroundColor: theme.surfaceAlt,
    borderColor: theme.border,
    color: theme.text,
  }
  const activeUser = useUserStore((s) => s.activeUser)
  const users = useUserStore((s) => s.users)
  const updateActiveUser = useUserStore((s) => s.updateActiveUser)
  const setLanguage = useUserStore((s) => s.setLanguage)

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
    setBackupStatus(t('status.exporting'))
    await storage.setMeta('lastObzExportAt', String(Date.now())) // §12.5
    const blob = await exportPageSet(activeUser.activePageSetId)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'saythrough-pageset.obz'
    anchor.click()
    URL.revokeObjectURL(url)
    setBackupStatus(t('status.exported'))
  }

  // §10.5 enhanced neural voice. The download is ~60 MB, so it is explicit,
  // shows real progress, and never starts on its own.
  const [voiceStatus, setVoiceStatus] = useState<string | undefined>()
  const [voiceBusy, setVoiceBusy] = useState(false)

  const enableEnhancedVoice = async () => {
    setVoiceBusy(true)
    setVoiceStatus(t('status.voiceDownloading', { percent: 0 }))
    const ok = await enhancedBackend.init(
      (loaded, total) => {
        const pct = total ? Math.round((loaded / total) * 100) : 0
        setVoiceStatus(t('status.voiceDownloading', { percent: pct }))
      },
      // Each language has its own ~60 MB model; only the active one is
      // fetched, so a Spanish profile never downloads the English voice.
      activeUser.language,
    )
    setVoiceBusy(false)
    if (ok) {
      await updateActiveUser({ ttsEngine: 'enhanced' })
      setVoiceStatus(t('status.voiceReady'))
      ttsService.speak(t('settings.previewText'))
    } else {
      const reason = ttsService.fallbackReason() ?? enhancedBackend.lastError()
      setVoiceStatus(
        t('status.voiceFailed', {
          reason: reason ?? t('status.voiceFailedDefault'),
        }),
      )
    }
  }

  const useStandardVoice = async () => {
    await updateActiveUser({ ttsEngine: 'platform' })
    setVoiceStatus(undefined)
  }

  // §14.3 full device backup — everything, not just vocabulary. The .obz
  // export above carries a page set; this carries profiles, access-method
  // tuning, voice, PIN, word lists, history and tracking, so a lost device or
  // evicted browser storage is recoverable.
  const [restoreFile, setRestoreFile] = useState<string | null>(null)

  const exportEverything = async () => {
    if (Platform.OS !== 'web') return
    setBackupStatus(t('status.exporting'))
    const backup = await createBackup(storage)
    const blob = new Blob([serializeBackup(backup)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    const stamp = new Date(backup.exportedAt).toISOString().slice(0, 10)
    anchor.download = `saythrough-backup-${stamp}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setBackupStatus(t('status.backupSaved'))
  }

  // Two steps on purpose: restoring REPLACES everything on this device, so
  // the file is validated and described before anything is written.
  const chooseRestoreFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: false,
    })
    if (result.canceled || !result.assets?.[0]) return
    try {
      const response = await fetch(result.assets[0].uri)
      const text = await response.text()
      const backup = parseBackup(text)
      const when = new Date(backup.exportedAt).toLocaleDateString()
      const names = backup.data.users.map((u) => u.name).join(', ')
      setRestoreFile(text)
      setBackupStatus(
        t('status.backupDescribed', {
          when,
          count: backup.data.users.length,
          names,
        }),
      )
    } catch (error) {
      setRestoreFile(null)
      setBackupStatus(error instanceof Error ? error.message : String(error))
    }
  }

  const confirmRestore = async () => {
    if (!restoreFile) return
    setBackupStatus(t('status.restoring'))
    try {
      await restoreBackup(storage, parseBackup(restoreFile))
      setRestoreFile(null)
      await useUserStore.getState().load()
      const user = useUserStore.getState().activeUser
      const pageSet = user ? await storage.getPageSet(user.activePageSetId) : null
      if (pageSet) {
        useNavigationStore.getState().setActivePageSet(pageSet.id, pageSet.rootPageId)
      }
      setPageSets(await storage.getPageSets())
      setWordLists(user ? await storage.getWordLists(user.id) : [])
      setBackupStatus(t('status.restored'))
    } catch (error) {
      setBackupStatus(t('status.restoreFailed', { error: String(error) }))
    }
  }

  // §18.4 — clears the learned prediction model for this profile only,
  // leaving tracking data, message history and vocabulary untouched.
  const [learnedCleared, setLearnedCleared] = useState(false)
  const [countingOn, setCountingOn] = useState(isUsageCountingEnabled)
  const clearLearnedWords = async () => {
    await resetLearning(activeUser?.id)
    setLearnedCleared(true)
  }

  const [restoreArmed, setRestoreArmed] = useState(false)

  // Safety net: rebuild built-in sets from seed, keep user content
  const restoreBuiltIns = async () => {
    if (!restoreArmed) {
      setRestoreArmed(true)
      setBackupStatus(t('status.rebuildArmed'))
      return
    }
    setRestoreArmed(false)
    setBackupStatus(t('status.restoring'))
    const coreId = await restoreBuiltInPageSets(storage)
    await useUserStore.getState().load()
    const user = useUserStore.getState().activeUser
    const pageSet = await storage.getPageSet(user?.activePageSetId ?? coreId)
    if (pageSet) {
      useNavigationStore.getState().setActivePageSet(pageSet.id, pageSet.rootPageId)
    }
    setPageSets(await storage.getPageSets())
    setBackupStatus(t('status.builtInRestored'))
  }

  const importObz = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: false,
    })
    if (result.canceled || !result.assets?.[0]) return
    setBackupStatus(t('status.importing'))
    try {
      const response = await fetch(result.assets[0].uri)
      const imported = await importPageSet(await response.arrayBuffer())
      setPageSets(await storage.getPageSets())
      setBackupStatus(t('status.imported', { name: imported.name }))
    } catch (error) {
      setBackupStatus(t('status.importFailed', { error: String(error) }))
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.screen }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.chrome, borderBottomColor: theme.chromeBorder },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.backToCommunication')}
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={[styles.backText, { color: theme.accent }]}>{t('common.back')}</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* 1. Profile */}
        <Text style={[styles.sectionTitle, mutedT]}>{t('settings.profile')}</Text>
        <View style={[styles.card, cardT]}>
          <Text style={[styles.fieldLabel, mutedT]}>{t('settings.name')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            onEndEditing={() => name.trim() && updateActiveUser({ name: name.trim() })}
            onBlur={() => name.trim() && updateActiveUser({ name: name.trim() })}
            style={[styles.input, inputT]}
            accessibilityLabel={t('settings.nameLabel')}
          />
          <Text style={[styles.fieldLabel, mutedT]}>{t('settings.switchProfile')}</Text>
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
              placeholder={t('settings.newProfilePlaceholder')}
              style={[styles.input, styles.addInput, inputT]}
              accessibilityLabel={t('settings.newProfileLabel')}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('settings.addProfile')}
              onPress={addUser}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            >
              <Text style={styles.addButtonText}>{t('common.add')}</Text>
            </Pressable>
          </View>
        </View>

        {/* 1b. Language (§19.7) */}
        <Text style={[styles.sectionTitle, mutedT]}>{t('settings.language')}</Text>
        <View style={[styles.card, cardT]}>
          <View style={styles.chipRow}>
            {SUPPORTED_LANGUAGES.map((option) => (
              <Chip
                key={option.code}
                label={option.label}
                selected={langCode(activeUser.language) === option.code}
                onPress={() => setLanguage(option.bcp47)}
              />
            ))}
          </View>
          <Text style={[styles.hint, mutedT]}>{t('settings.languageHint')}</Text>
        </View>

        {/* 2. Speech */}
        <Text style={[styles.sectionTitle, mutedT]}>{t('settings.speech')}</Text>
        <View style={[styles.card, cardT]}>
          <Text style={[styles.fieldLabel, mutedT]}>{t('settings.voice')}</Text>
          {voices.map((voice) => (
            <View key={voice.identifier} style={styles.voiceRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Select voice ${voice.name}`}
                onPress={() => updateActiveUser({ ttsVoiceId: voice.identifier })}
                style={styles.voiceSelect}
              >
                <Text style={[styles.voiceRadio, { color: theme.accent }]}>
                  {activeUser.ttsVoiceId === voice.identifier ? '◉' : '○'}
                </Text>
                <Text style={[styles.voiceName, { color: theme.text }]} numberOfLines={1}>
                  {voice.name}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Preview voice ${voice.name}`}
                onPress={() =>
                  ttsService.speak(t('settings.previewText'), { voiceId: voice.identifier })
                }
                style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}
              >
                <Text style={[styles.previewText, { color: theme.text }]}>▶</Text>
              </Pressable>
            </View>
          ))}
          {voices.length === 0 && (
            <Text style={[styles.hint, mutedT]}>{t('settings.noVoices')}</Text>
          )}

          <Text style={[styles.fieldLabel, mutedT]}>{t('settings.speed')}</Text>
          <View style={styles.chipRow}>
            {RATE_PRESETS.map(([label, value]) => (
              <Chip
                key={label}
                label={t(label)}
                selected={Math.abs(activeUser.ttsRate - value) < 0.01}
                onPress={() => updateActiveUser({ ttsRate: value })}
              />
            ))}
          </View>

          <Text style={[styles.fieldLabel, mutedT]}>{t('settings.pitch')}</Text>
          <View style={styles.chipRow}>
            {PITCH_PRESETS.map(([label, value]) => (
              <Chip
                key={label}
                label={t(label)}
                selected={Math.abs(activeUser.ttsPitch - value) < 0.01}
                onPress={() => updateActiveUser({ ttsPitch: value })}
              />
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>{t('settings.speakOnSelect')}</Text>
            <Switch
              value={activeUser.speakOnSelect}
              onValueChange={(value) => updateActiveUser({ speakOnSelect: value })}
              accessibilityLabel={t('settings.speakOnSelect')}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>{t('settings.returnHome')}</Text>
            <Switch
              value={activeUser.returnHomeAfterSpeak ?? false}
              onValueChange={(value) => updateActiveUser({ returnHomeAfterSpeak: value })}
              accessibilityLabel={t('settings.returnHome')}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>{t('settings.clearAfter')}</Text>
            <Switch
              value={activeUser.clearAfterSpeak ?? false}
              onValueChange={(value) => updateActiveUser({ clearAfterSpeak: value })}
              accessibilityLabel={t('settings.clearAfter')}
            />
          </View>
        </View>

        {/* Quick-fire message-bar buttons */}
        <Text style={[styles.sectionTitle, mutedT]}>{t('settings.quickButtons')}</Text>
        <View style={[styles.card, cardT]}>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>{t('settings.attentionBell')}</Text>
            <Switch
              value={activeUser.attentionButton ?? true}
              onValueChange={(value) => updateActiveUser({ attentionButton: value })}
              accessibilityLabel={t('settings.attentionBell')}
            />
          </View>
          <Text style={[styles.fieldLabel, mutedT]}>
            Emergency phrase (spoken with one tap; leave blank to hide the button)
          </Text>
          <TextInput
            value={activeUser.emergencyPhrase ?? 'I need help.'}
            onChangeText={(text) => updateActiveUser({ emergencyPhrase: text })}
            style={[styles.input, inputT]}
            accessibilityLabel={t('settings.emergencyPhrase')}
            placeholder={t('settings.emergencyPlaceholder')}
          />
        </View>

        {/* 3. Access Method (§4.6) */}
        <Text style={[styles.sectionTitle, mutedT]}>{t('settings.accessMethod')}</Text>
        <View style={[styles.card, cardT]}>
          <Text style={[styles.fieldLabel, mutedT]}>{t('settings.howSelects')}</Text>
          <View style={styles.chipRow}>
            {(
              [
                ['touch', 'settings.touch'],
                ['dwell', 'settings.dwell'],
                ['scanning', 'settings.scanning'],
              ] as const
            ).map(([value, label]) => (
              <Chip
                key={value}
                label={t(label)}
                selected={(activeUser.accessMethod ?? 'touch') === value}
                onPress={() => updateActiveUser({ accessMethod: value })}
              />
            ))}
          </View>

          {(activeUser.accessMethod ?? 'touch') === 'touch' && (
            <>
              <Text style={[styles.fieldLabel, mutedT]}>{t('settings.holdToActivate')}</Text>
              <View style={styles.chipRow}>
                {HOLD_PRESETS.map(([label, value]) => (
                  <Chip
                    key={label}
                    label={t(label)}
                    selected={(activeUser.touchHoldDuration ?? 0) === value}
                    onPress={() => updateActiveUser({ touchHoldDuration: value })}
                  />
                ))}
              </View>
              <Text style={[styles.fieldLabel, mutedT]}>{t('settings.ignoreRepeat')}</Text>
              <View style={styles.chipRow}>
                {HOLD_PRESETS.map(([label, value]) => (
                  <Chip
                    key={label}
                    label={t(label)}
                    selected={(activeUser.touchDebounce ?? 0) === value}
                    onPress={() => updateActiveUser({ touchDebounce: value })}
                  />
                ))}
              </View>
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, textT]}>
                  Ignore second touch while pressing (palm guard)
                </Text>
                <Switch
                  value={activeUser.ignoreSecondTouch ?? false}
                  onValueChange={(v) => updateActiveUser({ ignoreSecondTouch: v })}
                  accessibilityLabel={t('settings.ignoreSecondTouch')}
                />
              </View>
            </>
          )}

          {activeUser.accessMethod === 'dwell' && (
            <>
              <Text style={[styles.fieldLabel, mutedT]}>{t('settings.hoverTime')}</Text>
              <View style={styles.chipRow}>
                {DWELL_PRESETS.map(([label, value]) => (
                  <Chip
                    key={label}
                    label={t(label)}
                    selected={(activeUser.dwellTime ?? 1000) === value}
                    onPress={() => updateActiveUser({ dwellTime: value })}
                  />
                ))}
              </View>
              <Text style={[styles.hint, mutedT]}>
                Hover the pointer over a button (mouse, head mouse, or eye
                gaze that moves the cursor); it selects when the bar fills.
                Move away to cancel.
              </Text>
            </>
          )}

          {activeUser.accessMethod === 'scanning' && (
            <>
              <Text style={[styles.fieldLabel, mutedT]}>{t('settings.scanStyle')}</Text>
              <View style={styles.chipRow}>
                <Chip
                  label={t('settings.scanAuto')}
                  selected={(activeUser.scanMode ?? 'auto') === 'auto'}
                  onPress={() => updateActiveUser({ scanMode: 'auto' })}
                />
                <Chip
                  label={t('settings.scanStep')}
                  selected={activeUser.scanMode === 'step'}
                  onPress={() => updateActiveUser({ scanMode: 'step' })}
                />
              </View>
              <Text style={[styles.fieldLabel, mutedT]}>{t('settings.pattern')}</Text>
              <View style={styles.chipRow}>
                <Chip
                  label={t('settings.rowColumn')}
                  selected={(activeUser.scanPattern ?? 'row-column') === 'row-column'}
                  onPress={() => updateActiveUser({ scanPattern: 'row-column' })}
                />
                <Chip
                  label={t('settings.linear')}
                  selected={activeUser.scanPattern === 'linear'}
                  onPress={() => updateActiveUser({ scanPattern: 'linear' })}
                />
              </View>
              {(activeUser.scanMode ?? 'auto') === 'auto' && (
                <>
                  <Text style={[styles.fieldLabel, mutedT]}>{t('settings.scanSpeed')}</Text>
                  <View style={styles.chipRow}>
                    {SCAN_SPEEDS.map(([label, value]) => (
                      <Chip
                        key={label}
                        label={t(label)}
                        selected={(activeUser.scanSpeed ?? 1500) === value}
                        onPress={() => updateActiveUser({ scanSpeed: value })}
                      />
                    ))}
                  </View>
                </>
              )}
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, textT]}>{t('settings.scanAuditory')}</Text>
                <Switch
                  value={activeUser.scanAuditory ?? false}
                  onValueChange={(v) => updateActiveUser({ scanAuditory: v })}
                  accessibilityLabel={t('settings.scanAuditoryLabel')}
                />
              </View>
              <Text style={[styles.hint, mutedT]}>
                Switch = Space (select) and, in step mode, Enter (advance).
                Most Bluetooth switches emulate these keys. Two-switch
                mapping and block scanning are coming next.
              </Text>
            </>
          )}
        </View>

        {/* 3b. Display (§6.1 layout preferences) */}
        <Text style={[styles.sectionTitle, mutedT]}>{t('settings.display')}</Text>
        <View style={[styles.card, cardT]}>
          <Text style={[styles.fieldLabel, mutedT]}>{t('settings.appearance')}</Text>
          <View style={styles.chipRow}>
            {(
              [
                ['light', 'settings.themeLight'],
                ['dark', 'settings.themeDark'],
                ['system', 'settings.themeSystem'],
              ] as const
            ).map(([value, label]) => (
              <Chip
                key={value}
                label={t(label)}
                selected={(activeUser.theme ?? 'system') === value}
                onPress={() => updateActiveUser({ theme: value })}
              />
            ))}
          </View>
          <Text style={[styles.fieldLabel, mutedT]}>{t('settings.barPosition')}</Text>
          <View style={styles.chipRow}>
            <Chip
              label={t('settings.barTop')}
              selected={(activeUser.messageBarPosition ?? 'top') === 'top'}
              onPress={() => updateActiveUser({ messageBarPosition: 'top' })}
            />
            <Chip
              label={t('settings.barBottom')}
              selected={activeUser.messageBarPosition === 'bottom'}
              onPress={() => updateActiveUser({ messageBarPosition: 'bottom' })}
            />
          </View>
          <Text style={[styles.fieldLabel, mutedT]}>{t('settings.buttonGap')}</Text>
          <View style={styles.chipRow}>
            {(
              [
                ['compact', 'settings.gapCompact'],
                ['normal', 'settings.gapNormal'],
                ['wide', 'settings.gapWide'],
              ] as const
            ).map(([gap, label]) => (
              <Chip
                key={gap}
                label={t(label)}
                selected={(activeUser.buttonGap ?? 'normal') === gap}
                onPress={() => updateActiveUser({ buttonGap: gap })}
              />
            ))}
          </View>
          <Text style={[styles.fieldLabel, mutedT]}>{t('settings.textSize')}</Text>
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
        <Text style={[styles.sectionTitle, mutedT]}>{t('settings.vocabulary')}</Text>
        <View style={[styles.card, cardT]}>
          <Text style={[styles.fieldLabel, mutedT]}>{t('settings.activePageSet')}</Text>
          <View style={styles.chipRow}>
            {pageSets
              .filter(
                (pageSet) =>
                  !pageSet.isBuiltIn ||
                  langCode(pageSet.language) === langCode(activeUser.language),
              )
              .map((pageSet) => (
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
        <Text style={[styles.sectionTitle, mutedT]}>{t('settings.vocabularyFilter')}</Text>
        <View style={[styles.card, cardT]}>
          <Text style={[styles.hint, mutedT]}>
            Limit which words are active during therapy. Words not in the
            list stay visible (so a partner can model) but don't respond.
          </Text>
          {wordLists.length > 0 && <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{t('settings.wordLists')}</Text>}
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
                label={t('settings.selectWords')}
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
                label={t('settings.deleteList')}
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
              placeholder={t('settings.newListPlaceholder')}
              style={[styles.input, styles.addInput, inputT]}
              accessibilityLabel={t('settings.newListLabel')}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('settings.addList')}
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
              <Text style={styles.addButtonText}>{t('common.add')}</Text>
            </Pressable>
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>{t('settings.filterOn')}</Text>
            <Switch
              value={activeUser.filterEnabled ?? false}
              onValueChange={(value) => updateActiveUser({ filterEnabled: value })}
              accessibilityLabel={t('settings.filterEnabled')}
            />
          </View>
        </View>

        {/* 5. Security */}
        <Text style={[styles.sectionTitle, mutedT]}>{t('settings.security')}</Text>
        <View style={[styles.card, cardT]}>
          <Text style={[styles.hint, mutedT]}>
            The caregiver PIN protects edit mode and settings. It is
            child-proofing, not security.
          </Text>
          <View style={styles.chipRow}>
            <Chip
              label={activeUser.editPinHash ? t('pin.change') : t('pin.set')}
              selected={false}
              onPress={() => setPinModalVisible(true)}
            />
            {activeUser.editPinHash && (
              <Chip
                label={t('pin.remove')}
                selected={false}
                onPress={() =>
                  updateActiveUser({ editPinHash: undefined, editPinSalt: undefined })
                }
              />
            )}
          </View>
        </View>

        {/* 4c. Enhanced voice (§10.5) */}
        <Text style={[styles.sectionTitle, mutedT]}>{t('settings.enhancedVoice')}</Text>
        <View style={[styles.card, cardT]}>
          <Text style={[styles.hint, mutedT]}>
            A natural-sounding voice that runs entirely ON THIS DEVICE — nothing
            is sent to a server. It is a one-time ~60 MB download and works
            offline afterwards. The standard voice keeps working either way.
          </Text>
          <View style={styles.chipRow}>
            <Chip
              label={
                (activeUser.ttsEngine ?? 'platform') === 'platform'
                  ? t('settings.standardVoice')
                  : t('settings.useStandardVoice')
              }
              selected={(activeUser.ttsEngine ?? 'platform') === 'platform'}
              onPress={useStandardVoice}
            />
            <Chip
              label={voiceBusy ? t('settings.enhancedVoiceDownloading') : t('settings.enhancedVoiceToggle')}
              selected={activeUser.ttsEngine === 'enhanced'}
              onPress={voiceBusy ? () => {} : enableEnhancedVoice}
            />
          </View>
          {voiceStatus ? <Text style={[styles.hint, { color: theme.textMuted }]}>{voiceStatus}</Text> : null}
        </View>

        {/* 5. Vocabulary level (§19) — only where the board defines levels */}
        {levelCountForPageSet(activeUser.activePageSetId) > 1 && (
          <>
            <Text style={[styles.sectionTitle, mutedT]}>{t('settings.vocabularyLevel')}</Text>
            <View style={[styles.card, cardT]}>
              <Text style={[styles.hint, mutedT]}>
                Show fewer words while someone is learning the board. Words
                stay in the SAME place at every level — raising the level only
                reveals more, so nothing a user has already learned to reach
                ever moves.
              </Text>
              <View style={styles.chipRow}>
                {VOCABULARY_LEVELS.map(([label, value]) => (
                  <Chip
                    key={value}
                    label={t(label)}
                    selected={(activeUser.vocabularyLevel ?? 3) === value}
                    onPress={() => updateActiveUser({ vocabularyLevel: value })}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        {/* 5a. Word Prediction (§18) */}
        <Text style={[styles.sectionTitle, mutedT]}>{t('settings.wordPrediction')}</Text>
        <View style={[styles.card, cardT]}>
          <Text style={[styles.hint, mutedT]}>
            Suggests words above the keyboard as you type. It learns from
            messages you speak — including words tapped on the grid — so the
            words you actually use come first. Learned words stay ON THIS
            DEVICE, are never sent anywhere, and are separate from data
            tracking below.
          </Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>{t('settings.predictionToggle')}</Text>
            <Switch
              value={activeUser.predictionEnabled ?? true}
              onValueChange={(value) => updateActiveUser({ predictionEnabled: value })}
              accessibilityLabel={t('settings.predictionLabel')}
            />
          </View>
          <View style={styles.chipRow}>
            <Chip
              label={learnedCleared ? t('settings.learnedCleared') : t('settings.clearLearned')}
              selected={false}
              onPress={clearLearnedWords}
            />
          </View>
        </View>

        {/* 5b. Data Tracking (§4.13 — consent-gated, DT-05) */}
        <Text style={[styles.sectionTitle, mutedT]}>{t('settings.dataTracking')}</Text>
        <View style={[styles.card, cardT]}>
          <Text style={[styles.hint, mutedT]}>
            Off by default. When a caregiver turns it on, button presses and
            spoken messages are recorded ON THIS DEVICE ONLY and are never
            sent anywhere. SLPs use this to document progress.
          </Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>{t('settings.trackingToggle')}</Text>
            <Switch
              value={activeUser.trackingEnabled ?? false}
              onValueChange={(value) => updateActiveUser({ trackingEnabled: value })}
              accessibilityLabel={t('settings.trackingLabel')}
            />
          </View>
          <View style={styles.chipRow}>
            <Chip
              label={t('settings.viewReport')}
              selected={false}
              onPress={() => navigation.navigate('TrackingReport')}
            />
          </View>
        </View>

        {/* 5c. Privacy — the one thing that does leave the device */}
        <Text style={[styles.sectionTitle, mutedT]}>{t('settings.privacy')}</Text>
        <View style={[styles.card, cardT]}>
          <Text style={[styles.hint, mutedT]}>
            While the app is open it checks in, so the project can tell
            whether anyone is using it. The check-in carries a random code that
            changes every time you open the app and is never stored — no name,
            no account, nothing that identifies you. It is the ONLY thing that
            leaves this device: words, messages, pages and recordings never do.
          </Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>{t('settings.usageToggle')}</Text>
            <Switch
              value={countingOn}
              onValueChange={(value) => {
                setUsageCountingEnabled(value)
                setCountingOn(value)
              }}
              accessibilityLabel={t('settings.usageLabel')}
            />
          </View>
        </View>

        {/* 6. Backup & Restore */}
        <Text style={[styles.sectionTitle, mutedT]}>{t('settings.backup')}</Text>
        <View style={[styles.card, cardT]}>
          <Text style={[styles.hint, mutedT]}>{t('settings.backupHint')}</Text>
          <View style={styles.chipRow}>
            <Chip
              label={t('settings.saveBackup')}
              selected={false}
              onPress={exportEverything}
            />
            <Chip
              label={restoreFile ? t('settings.chooseDifferent') : t('settings.restoreBackup')}
              selected={false}
              onPress={chooseRestoreFile}
            />
            {restoreFile ? (
              <Chip label={t('settings.confirmRestore')} selected onPress={confirmRestore} />
            ) : null}
          </View>
        </View>

        <View style={[styles.card, cardT]}>
          <Text style={[styles.hint, mutedT]}>{t('settings.obfHint')}</Text>
          <View style={styles.chipRow}>
            <Chip
              label={t('settings.exportObz')}
              selected={false}
              onPress={exportActive}
            />
            <Chip label={t('settings.importObz')} selected={false} onPress={importObz} />
            <Chip
              label={restoreArmed ? t('settings.restoreArmed') : t('settings.restoreBuiltIn')}
              selected={false}
              onPress={restoreBuiltIns}
            />
          </View>
          {backupStatus ? <Text style={[styles.hint, { color: theme.textMuted }]}>{backupStatus}</Text> : null}
        </View>

        {/* 6b. Install (§12.6) */}
        {installState !== 'unavailable' && (
          <>
            <Text style={[styles.sectionTitle, mutedT]}>{t('settings.install')}</Text>
            <View style={[styles.card, cardT]}>
              {installState === 'installed' && (
                <Text style={[styles.hint, mutedT]}>{t('settings.installed')}</Text>
              )}
              {installState === 'installable' && (
                <>
                  <Text style={[styles.hint, mutedT]}>{t('settings.installHint')}</Text>
                  <View style={styles.chipRow}>
                    <Chip
                      label={t('settings.installButton')}
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
                <Text style={[styles.hint, mutedT]}>{t('settings.installIosHint')}</Text>
              )}
            </View>
          </>
        )}

        {/* 7. About */}
        <Text style={[styles.sectionTitle, mutedT]}>{t('settings.about')}</Text>
        <View style={[styles.card, cardT]}>
          <Text style={[styles.hint, mutedT]}>
            {t('settings.aboutBody')}
            {'\n\n'}
            {t('settings.aboutSymbols')}
            {'\n'}
            {t('settings.aboutMulberry')}
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
  const theme = useTheme()
  const t = useT()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: theme.text },
          selected && styles.chipTextSelected,
        ]}
      >
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
  const theme = useTheme()
  const t = useT()
  const inputT = {
    backgroundColor: theme.surfaceAlt,
    borderColor: theme.border,
    color: theme.text,
  }
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
      <View style={[styles.backdrop, { backgroundColor: theme.backdrop }]}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Set caregiver PIN
          </Text>
          <TextInput
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            placeholder={t('pin.newPlaceholder')}
            style={[styles.input, inputT]}
            accessibilityLabel={t('pin.newPlaceholder')}
          />
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            placeholder={t('pin.confirmPlaceholder')}
            style={[styles.input, inputT]}
            accessibilityLabel={t('pin.confirmPlaceholder')}
          />
          {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
          <View style={styles.chipRow}>
            <Chip label={t('common.cancel')} selected={false} onPress={onClose} />
            <Chip label={t('pin.save')} selected onPress={save} />
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
    textAlign: 'center',
    fontSize: 13,
  },
  pressed: {
    opacity: 0.7,
  },
})
