import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { CommunicationScreen } from './src/screens/CommunicationScreen'
import { SettingsScreen } from './src/screens/SettingsScreen'
import { bootstrap } from './src/services/bootstrap'

export type RootStackParamList = {
  Communication: undefined
  Settings: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    bootstrap().then(() => setReady(true))
  }, [])

  if (!ready) return null

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Communication" component={CommunicationScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  )
}
