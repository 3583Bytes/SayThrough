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
  const hasProfile = useUserStore((s) => s.activeUser !== null)
  const [fontsLoaded] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  })

  useEffect(() => {
    bootstrap().then(() => setBooted(true))
  }, [])

  if (!booted || !fontsLoaded) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingTitle}>SayThrough</Text>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingHint}>Getting your voice ready…</Text>
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
