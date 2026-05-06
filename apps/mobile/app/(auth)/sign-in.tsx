import { useSignIn } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { cores, espacamento, fontes, layout, radii } from '@/lib/theme'

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)

  const onSubmit = async () => {
    if (!isLoaded) return
    setCarregando(true)
    try {
      const r = await signIn.create({ identifier: email, password: senha })
      if (r.status === 'complete') {
        await setActive({ session: r.createdSessionId })
        router.replace('/(app)')
      } else {
        Alert.alert('Confirmacao adicional necessaria', 'Verifique email/2fa.')
      }
    } catch (e) {
      const msg = (e as { errors?: Array<{ message?: string }> }).errors?.[0]?.message ?? 'Erro ao entrar'
      Alert.alert('Erro', msg)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={layout.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.box}>
        <Text style={styles.titulo}>Entrar</Text>
        <Text style={styles.subtitulo}>Continue de onde parou.</Text>

        <View style={styles.campo}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="seu@email.com"
            style={styles.input}
          />
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            placeholder="••••••••"
            style={styles.input}
          />
        </View>

        <Button onPress={onSubmit} loading={carregando} size="lg">
          Entrar
        </Button>

        <Link href="/(auth)/sign-up" style={styles.link}>
          Nao tem conta? Cadastre-se
        </Link>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    padding: espacamento.lg,
    justifyContent: 'center',
    gap: espacamento.md,
  },
  titulo: { fontSize: fontes.size['3xl'], fontWeight: fontes.weight.bold, color: cores.foreground },
  subtitulo: { fontSize: fontes.size.md, color: cores.mutedForeground, marginBottom: espacamento.md },
  campo: { gap: espacamento.xs },
  label: { fontSize: fontes.size.sm, fontWeight: fontes.weight.medium, color: cores.foreground },
  input: {
    borderWidth: 1,
    borderColor: cores.border,
    borderRadius: radii.md,
    padding: espacamento.sm + 4,
    fontSize: fontes.size.md,
    backgroundColor: '#fff',
  },
  link: {
    textAlign: 'center',
    color: cores.primary,
    fontSize: fontes.size.sm,
    marginTop: espacamento.md,
  },
})
