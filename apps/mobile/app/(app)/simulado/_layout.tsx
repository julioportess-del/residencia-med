import { Stack } from 'expo-router'

export default function SimuladoLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Novo simulado' }} />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Simulado em andamento', headerBackTitle: 'Sair' }}
      />
    </Stack>
  )
}
