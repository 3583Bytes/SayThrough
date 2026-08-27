import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
  useFonts,
} from '@expo-google-fonts/atkinson-hyperlegible'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { CommunicationScreen } from './src/screens/CommunicationScreen'
import { OnboardingScreen } from './src/screens/OnboardingScreen'
import { SettingsScreen } from './src/screens/SettingsScreen'
import { TrackingReportScreen } from './src/screens/TrackingReportScreen'
import { useTheme } from './src/hooks/useTheme'
import { bootstrap } from './src/services/bootstrap'
import { useUserStore } from './src/stores/userStore'

export type RootStackParamList = {
  Onboarding: undefined
  Communication: undefined
  Settings: undefined
  TrackingReport: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  const [booted, setBooted] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)
  const hasProfile = useUserStore((s) => s.activeUser !== null)
  const theme = useTheme()
  const [fontsLoaded] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  })

  useEffect(() => {
    // ALWAYS finish booting, even if startup failed. Without the catch, any
    // rejection — a storage error under pressure, say — left the app on this
    // splash screen forever, with no way out and nothing said. For a device
    // somebody speaks through, silently hanging is the worst failure there is:
    // better to open with something broken and say so than never to open.
    bootstrap()
      .catch((error: unknown) => {
        console.error('SayThrough failed to start up', error)
        setBootError(error instanceof Error ? error.message : String(error))
      })
      .finally(() => setBooted(true))
  }, [])

  if (bootError) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.screen }]}>
        <Text style={styles.loadingTitle}>SayThrough</Text>
        <Text style={[styles.loadingHint, { color: theme.textMuted }]}>
          Something went wrong starting up. Your saved words are still on this
          device — reopening the app usually fixes it.
        </Text>
        <Text
          accessibilityRole="button"
          onPress={() => {
            setBootError(null)
            setBooted(false)
            bootstrap()
              .catch((error: unknown) =>
                setBootError(error instanceof Error ? error.message : String(error)),
              )
              .finally(() => setBooted(true))
          }}
          style={[styles.loadingHint, { color: '#4CAF50', marginTop: 16 }]}
        >
          Try again
        </Text>
        <Text style={[styles.loadingHint, { color: theme.textMuted, marginTop: 24, fontSize: 12 }]}>
          {bootError}
        </Text>
      </View>
    )
  }

  if (!booted || !fontsLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.screen }]}>
        <Text style={styles.loadingTitle}>SayThrough</Text>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={[styles.loadingHint, { color: theme.textMuted }]}>
          Getting your voice ready…
        </Text>
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {hasProfile ? (
          <>
            <Stack.Screen name="Communication" component={CommunicationScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="TrackingReport" component={TrackingReportScreen} />
          </>
        ) : (
          // §5.2: no profile yet → onboarding (or a guest session)
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  loadingHint: {
    fontSize: 14,
    color: '#888888',
  },
})
