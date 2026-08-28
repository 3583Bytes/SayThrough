import { useState } from 'react'
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { UI_COLORS } from '../constants/colors'
import { FONTS } from '../constants/typography'
import { useTheme } from '../hooks/useTheme'
import {
  type LanguageOption,
  SUPPORTED_LANGUAGES,
  langCode,
  translate,
} from '../i18n'
import { storage } from '../storage'
import { useNavigationStore } from '../stores/navigationStore'
import { useUserStore } from '../stores/userStore'
import type { PageSet } from '../types/models'
import { generatePinSalt, hashPin } from '../utils/pin'

/** `?lang=` on the app URL, set by the marketing site's language pages. */
function languageFromUrl(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null
  try {
    return new URLSearchParams(window.location.search).get('lang')
  } catch {
    return null
  }
}

// §5.2 onboarding — shown when no profile exists. Creates the first
// profile (name → starting vocabulary → skippable caregiver PIN) or
// starts a nothing-saved guest session ("Try SayThrough").
export function OnboardingScreen() {
  const theme = useTheme()
  const textT = { color: theme.text }
  const mutedT = { color: theme.textMuted }
  const inputT = {
    backgroundColor: theme.surfaceAlt,
    borderColor: theme.border,
    color: theme.text,
  }
  // No profile exists yet, so there is nothing to read a language off —
  // onboarding translates against the locally chosen option instead of
  // `useT()`, and the whole screen re-renders when it changes.
  //
  // §19.7: the marketing site links to `/app/?lang=pt`, so somebody arriving
  // from the Portuguese page is not asked a question that page already
  // answered. It only seeds the initial selection — the picker is still shown
  // and still changeable, and an unknown value falls back to English.
  const [language, setLanguageChoice] = useState<LanguageOption>(
    () => SUPPORTED_LANGUAGES.find((l) => l.code === languageFromUrl()) ?? SUPPORTED_LANGUAGES[0],
  )
  const t = (key: Parameters<typeof translate>[0], params?: Record<string, string | number>) =>
    translate(key, language.bcp47, params)
  const [step, setStep] = useState<'welcome' | 'setup'>('welcome')
  const [name, setName] = useState('')
  const [pageSets, setPageSets] = useState<PageSet[]>([])
  const [chosenSetId, setChosenSetId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)

  // Only the chosen language's boards are offered: a page set is authored in
  // one language and cannot be reflowed into another (§19.2), so mixing them
  // in one list would let someone pick a Spanish board for an English profile.
  const loadSetsFor = async (option: LanguageOption) => {
    const sets = (await storage.getPageSets()).filter(
      (s) => s.isBuiltIn && langCode(s.language) === option.code,
    )
    setPageSets(sets)
    const { coreSetIdForLanguage } = await import('../data/seedCoreVocabulary')
    const preferred = coreSetIdForLanguage(option.bcp47)
    setChosenSetId(sets.find((s) => s.id === preferred)?.id ?? sets[0]?.id ?? null)
  }

  const openSetup = async () => {
    await loadSetsFor(language)
    setStep('setup')
  }

  const chooseLanguage = async (option: LanguageOption) => {
    setLanguageChoice(option)
    setError(undefined)
    await loadSetsFor(option)
  }

  const tryGuest = async () => {
    const { coreSetIdForLanguage } = await import('../data/seedCoreVocabulary')
    const pageSet = await storage.getPageSet(coreSetIdForLanguage(language.bcp47))
    if (!pageSet) return
    useNavigationStore.getState().setActivePageSet(pageSet.id, pageSet.rootPageId)
    useUserStore.getState().startGuest(pageSet.id, language.bcp47)
  }

  const finish = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError(t('onboarding.errorName'))
      return
    }
    if (!chosenSetId) return
    if (pin && !/^\d{4,8}$/.test(pin)) {
      setError(t('onboarding.errorPinDigits'))
      return
    }
    if (pin && pin !== pinConfirm) {
      setError(t('onboarding.errorPinMatch'))
      return
    }
    setBusy(true)
    try {
      await useUserStore.getState().createUser(trimmed, chosenSetId, language.bcp47)
      if (pin) {
        const salt = generatePinSalt()
        await useUserStore.getState().updateActiveUser({
          editPinHash: await hashPin(pin, salt),
          editPinSalt: salt,
        })
      }
      const pageSet = await storage.getPageSet(chosenSetId)
      if (pageSet) {
        useNavigationStore.getState().setActivePageSet(pageSet.id, pageSet.rootPageId)
      }
      // App routes to Communication as soon as activeUser exists
    } finally {
      setBusy(false)
    }
  }

  if (step === 'welcome') {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.screen }]}>
        <View style={styles.welcome}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
            SayThrough
          </Text>
          <Text style={[styles.subtitle, textT]}>{t('onboarding.subtitle')}</Text>
          <Text style={[styles.tagline, mutedT]}>{t('onboarding.tagline')}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.setUpLabel')}
            onPress={openSetup}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryText}>{t('onboarding.setUp')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.tryItLabel')}
            onPress={tryGuest}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={[styles.secondaryText, { color: theme.accent }]}>
              {t('onboarding.tryIt')}
            </Text>
          </Pressable>
          <Text style={[styles.audience, mutedT]}>{t('onboarding.audience')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.screen }]}>
      <ScrollView contentContainerStyle={styles.form}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.backToWelcome')}
          onPress={() => {
            setError(undefined)
            setStep('welcome')
          }}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={[styles.backText, { color: theme.accent }]}>{t('common.back')}</Text>
        </Pressable>
        <Text style={[styles.heading, textT]}>{t('onboarding.language')}</Text>
        <View style={styles.chipRow}>
          {SUPPORTED_LANGUAGES.map((option) => (
            <Pressable
              key={option.code}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              onPress={() => chooseLanguage(option)}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                option.code === language.code && styles.chipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  textT,
                  option.code === language.code && styles.chipTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.hint, mutedT]}>{t('onboarding.languageHint')}</Text>

        <Text style={[styles.heading, textT]}>{t('onboarding.whoFor')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('onboarding.namePlaceholder')}
          style={[styles.input, inputT]}
          accessibilityLabel={t('onboarding.nameLabel')}
          autoFocus
        />

        <Text style={[styles.heading, textT]}>{t('onboarding.startingVocabulary')}</Text>
        <View style={styles.chipRow}>
          {pageSets.map((set) => (
            <Pressable
              key={set.id}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.startWith', { name: set.name })}
              onPress={() => setChosenSetId(set.id)}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                set.id === chosenSetId && styles.chipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  textT,
                  set.id === chosenSetId && styles.chipTextSelected,
                ]}
              >
                {set.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.hint, mutedT]}>{t('onboarding.vocabHint')}</Text>

        <Text style={[styles.heading, textT]}>{t('onboarding.pinHeading')}</Text>
        <Text style={[styles.hint, mutedT]}>{t('onboarding.pinHint')}</Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={8}
          placeholder={t('onboarding.pinPlaceholder')}
          style={[styles.input, inputT]}
          accessibilityLabel={t('onboarding.pinLabel')}
        />
        {pin !== '' && (
          <TextInput
            value={pinConfirm}
            onChangeText={setPinConfirm}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            placeholder={t('onboarding.pinConfirmPlaceholder')}
            style={[styles.input, inputT]}
            accessibilityLabel={t('onboarding.pinConfirmLabel')}
          />
        )}

        {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.finish')}
          onPress={finish}
          disabled={busy}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryText}>
            {busy ? t('onboarding.settingUp') : t('onboarding.startTalking')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  welcome: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 34,
    color: '#2E7D32',
  },
  subtitle: {
    fontFamily: FONTS.bold,
    fontSize: 19,
    textAlign: 'center',
    maxWidth: 460,
    lineHeight: 26,
  },
  tagline: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    maxWidth: 460,
    lineHeight: 24,
  },
  audience: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 19,
    marginTop: 8,
  },
  form: {
    padding: 24,
    gap: 10,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingRight: 12,
  },
  backText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#1976D2',
  },
  heading: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: UI_COLORS.buttonBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: UI_COLORS.barBorder,
  },
  chipSelected: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  chipText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  hint: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    fontSize: 13,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: UI_COLORS.speakGreen,
    paddingHorizontal: 28,
    marginTop: 10,
  },
  primaryText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 17,
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: '#1976D2',
  },
  pressed: {
    opacity: 0.7,
  },
})
