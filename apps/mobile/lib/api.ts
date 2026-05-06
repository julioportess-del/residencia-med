import Constants from 'expo-constants'

const FALLBACK = 'http://localhost:3000'

export function apiUrl(): string {
  // 1) variavel publica explicita
  const env = process.env.EXPO_PUBLIC_API_URL
  if (env) return env
  // 2) IP do servidor de desenvolvimento (debugger host)
  const debuggerHost =
    Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0]
    return `http://${host}:3000`
  }
  return FALLBACK
}
