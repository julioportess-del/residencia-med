import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuthSession } from '@/lib/auth-context'
import { layout } from '@/lib/theme'

export default function Index() {
  const { carregado, session } = useAuthSession()
  if (!carregado) {
    return (
      <View style={layout.centered}>
        <ActivityIndicator />
      </View>
    )
  }
  return <Redirect href={session ? '/(app)' : '/(auth)/sign-in'} />
}
