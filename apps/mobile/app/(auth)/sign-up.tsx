import { useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { cores, espacamento, fontes, layout, radii } from '@/lib/theme'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [codigo, setCodigo] = useState('')
  const [aguardandoCodigo, setAguardandoCodigo] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const onCriar = async () => {
    if (!isLoaded) return
    setCarregando(true)
    try {
      await signUp.create({ emailAddress: email, password: senha })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setAguardandoCodigo(true)
    } catch (e) {
      const msg = (e as { errors?: Array<{ message?: string }> }).errors?.[0]?.message ?? 'Erro ao cadastrar'
      Alert.alert('Erro', msg)
    } finally {
      setCarregando(false)
    }
  }

  const onConfirmar = async () => {
    if (!isLoaded) return
    setCarregando(true)
    try {
      const r = await signUp.attemptEmailAddressVerification({ code: codigo })
      if (r.status === 'complete') {
        await setActive({ session: r.createdSessionId })
        router.replace('/(app)')
      }
    } catch (e) {
      const msg = (e as { errors?: Array<{ message?: string }> }).errors?.[0]?.message ?? 'Código inválido'
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
        <Text style={styles.titulo}>{aguardandoCodigo ? 'Confirme seu email' : 'Criar conta'}</Text>
        <Text style={styles.subtitulo}>
          {aguardandoCodigo
            ? 'Enviamos um código para o email informado.'
            : 'Comece de graça, sem cartão de crédito.'}
        </Text>

        {!aguardandoCodigo ? (
          <>
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
            <Button onPress={onCriar} loading={carregando} size="lg">
              Cadastrar
            </Button>
            <Link href="/(auth)/sign-in" style={styles.link}>
              Já tenho conta
            </Link>
          </>
        ) : (
          <>
            <View style={styles.campo}>
              <Text style={styles.label}>Código recebido</Text>
              <TextInput
                value={codigo}
                onChangeText={setCodigo}
                keyboardType="number-pad"
                placeholder="123456"
                style={styles.input}
              />
            </View>
            <Button onPress={onConfirmar} loading={carregando} size="lg">
              Confirmar
            </Button>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  box: { flex: 1, padding: espacamento.lg, justifyContent: 'center', gap: espacamento.md },
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
  link: { textAlign: 'center', color: cores.primary, fontSize: fontes.size.sm, marginTop: espacamento.md },
})
