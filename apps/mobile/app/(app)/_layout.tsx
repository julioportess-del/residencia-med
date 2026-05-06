import { useAuth } from '@clerk/clerk-expo'
import { Redirect, Tabs } from 'expo-router'
import { useEffect } from 'react'
import { registrarPushToken } from '@/lib/notifications'
import { cores } from '@/lib/theme'

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth()

  useEffect(() => {
    if (isSignedIn) {
      void registrarPushToken()
    }
  }, [isSignedIn])

  if (!isLoaded) return null
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: cores.primary,
        tabBarInactiveTintColor: cores.mutedForeground,
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: { borderTopColor: cores.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="questoes" options={{ title: 'Questoes', headerShown: false }} />
      <Tabs.Screen name="simulado" options={{ title: 'Simulado', headerShown: false }} />
      <Tabs.Screen name="revisao" options={{ title: 'Revisao' }} />
      <Tabs.Screen name="conta" options={{ title: 'Conta' }} />
    </Tabs>
  )
}
