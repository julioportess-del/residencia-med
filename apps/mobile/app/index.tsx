import { useAuth } from '@clerk/clerk-expo'
import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { layout } from '@/lib/theme'

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded) {
    return (
      <View style={layout.centered}>
        <ActivityIndicator />
      </View>
    )
  }
  return <Redirect href={isSignedIn ? '/(app)' : '/(auth)/sign-in'} />
}
