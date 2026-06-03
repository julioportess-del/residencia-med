import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export const SUPABASE_HABILITADO = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL &&
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder'),
)

/**
 * Storage adapter: SecureStore em iOS/Android (criptografado, max 2KB),
 * AsyncStorage no web. Tokens Supabase costumam caber em <2KB.
 */
const storage =
  Platform.OS === 'web'
    ? AsyncStorage
    : {
        getItem: (k: string) => SecureStore.getItemAsync(k),
        setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
        removeItem: (k: string) => SecureStore.deleteItemAsync(k),
      }

export const supabase = createClient(URL, ANON, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
