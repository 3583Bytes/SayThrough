import { useState } from 'react'
import {
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
import { storage } from '../storage'
import { useNavigationStore } from '../stores/navigationStore'
import { useUserStore } from '../stores/userStore'
import type { PageSet } from '../types/models'
import { generatePinSalt, hashPin } from '../utils/pin'

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
  const [step, setStep] = useState<'welcome' | 'setup'>('welcome')
  const [name, setName] = useState('')
  const [pageSets, setPageSets] = useState<PageSet[]>([])
  const [chosenSetId, setChosenSetId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)

  const openSetup = async () => {
    const sets = (await storage.getPageSets()).filter((s) => s.isBuiltIn)
    setPageSets(sets)
    setChosenSetId(sets.find((s) => s.name === 'Core Vocabulary')?.id ?? sets[0]?.id ?? null)
    setStep('setup')
  }

  const tryGuest = async () => {
    const coreId = await storage.getMeta('coreVocabularySeeded')
    const pageSet = coreId ? await storage.getPageSet(coreId) : null
    if (!pageSet) return
    useNavigationStore.getState().setActivePageSet(pageSet.id, pageSet.rootPageId)
    useUserStore.getState().startGuest(pageSet.id)
  }

  const finish = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a name — it can be changed later.')
      return
    }
    if (!chosenSetId) return
    if (pin && !/^\d{4,8}$/.test(pin)) {
      setError('The PIN must be 4–8 digits (or leave it empty).')
      return
    }
    if (pin && pin !== pinConfirm) {
      setError('The PINs do not match.')
      return
    }
    setBusy(true)
    try {
      await useUserStore.getState().createUser(trimmed, chosenSetId)
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
          <Text style={styles.title}>SayThrough</Text>
          <Text style={[styles.tagline, mutedT]}>
            A free voice for everyone. No account, no subscription — your
            words stay on this device.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Set up SayThrough"
            onPress={openSetup}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryText}>Let's set up a voice</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try SayThrough"
            onPress={tryGuest}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryText}>Try it first — nothing is saved</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.screen }]}>
      <ScrollView contentContainerStyle={styles.form}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to welcome"
          onPress={() => {
            setError(undefined)
            setStep('welcome')
          }}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={[styles.heading, textT]}>Who is this voice for?</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name (e.g. Maya)"
          style={[styles.input, inputT]}
          accessibilityLabel="User name"
          autoFocus
        />

        <Text style={[styles.heading, textT]}>Starting vocabulary</Text>
        <View style={styles.chipRow}>
          {pageSets.map((set) => (
            <Pressable
              key={set.id}
              accessibilityRole="button"
              accessibilityLabel={`Start with ${set.name}`}
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
        <Text style={[styles.hint, mutedT]}>
          Core Vocabulary is recommended for most users — it's built around
          the words that make up most of daily speech.
        </Text>

        <Text style={[styles.heading, textT]}>Caregiver PIN (recommended)</Text>
        <Text style={[styles.hint, mutedT]}>
          Protects edit mode and settings. Without a PIN, a long-press on
          any button opens editing. You can set one later in Settings.
        </Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={8}
          placeholder="PIN (4–8 digits, optional)"
          style={[styles.input, inputT]}
          accessibilityLabel="Caregiver PIN"
        />
        {pin !== '' && (
          <TextInput
            value={pinConfirm}
            onChangeText={setPinConfirm}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            placeholder="Confirm PIN"
            style={[styles.input, inputT]}
            accessibilityLabel="Confirm caregiver PIN"
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Finish setup"
          onPress={finish}
          disabled={busy}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryText}>{busy ? 'Setting up…' : 'Start talking'}</Text>
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
  tagline: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 24,
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
    color: '#777777',
    lineHeight: 19,
  },
  error: {
    color: UI_COLORS.clearRed,
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
