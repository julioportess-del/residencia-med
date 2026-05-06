import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo'
import { Slot } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { tokenCache } from '@/components/clerk-token-cache'
import { TRPCProvider } from '@/components/trpc-provider'

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

export default function RootLayout() {
  if (!PUBLISHABLE_KEY) {
    throw new Error(
      'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ausente. Defina no .env do apps/mobile.',
    )
  }
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={PUBLISHABLE_KEY}>
      <ClerkLoaded>
        <SafeAreaProvider>
          <TRPCProvider>
            <StatusBar style="auto" />
            <Slot />
          </TRPCProvider>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  )
}
