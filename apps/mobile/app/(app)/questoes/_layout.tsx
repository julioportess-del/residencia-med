import { Stack } from 'expo-router'

export default function QuestoesLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Banco de questoes' }} />
      <Stack.Screen name="[id]" options={{ title: 'Questao' }} />
    </Stack>
  )
}
