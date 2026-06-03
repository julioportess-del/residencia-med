import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function registrarPushToken(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1d4ed8',
    })
  }

  const { status: existente } = await Notifications.getPermissionsAsync()
  let status = existente
  if (existente !== 'granted') {
    const { status: novoStatus } = await Notifications.requestPermissionsAsync()
    status = novoStatus
  }
  if (status !== 'granted') return null

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId

  try {
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
    return token.data
  } catch {
    return null
  }
}

export async function agendarLembreteDiario(hora: number, minuto: number): Promise<string> {
  await Notifications.cancelAllScheduledNotificationsAsync()
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hora de estudar 📚',
      body: 'Voce tem itens de revisao vencendo hoje. Bora abrir o app?',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hora,
      minute: minuto,
    },
  })
}
