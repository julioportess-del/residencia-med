import { Redirect, Stack } from 'expo-router'
import { useAuthSession } from '@/lib/auth-context'

export default function AuthLayout() {
  const { session } = useAuthSession()
  if (session) return <Redirect href="/(app)" />
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff' },
      }}
    />
  )
}
