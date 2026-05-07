import { Redirect, Tabs } from 'expo-router'
import { useEffect } from 'react'
import { useAuthSession } from '@/lib/auth-context'
import { registrarPushToken } from '@/lib/notifications'
import { cores } from '@/lib/theme'

export default function AppLayout() {
  const { carregado, session } = useAuthSession()

  useEffect(() => {
    if (session) {
      void registrarPushToken()
    }
  }, [session])

  if (!carregado) return null
  if (!session) return <Redirect href="/(auth)/sign-in" />

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
      <Tabs.Screen
        name="onboarding"
        options={{ title: 'Onboarding', href: null, headerShown: false }}
      />
    </Tabs>
  )
}
