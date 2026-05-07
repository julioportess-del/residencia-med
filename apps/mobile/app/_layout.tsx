import { Slot } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '@/lib/auth-context'
import { TRPCProvider } from '@/components/trpc-provider'

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <TRPCProvider>
          <StatusBar style="auto" />
          <Slot />
        </TRPCProvider>
      </SafeAreaProvider>
    </AuthProvider>
  )
}
