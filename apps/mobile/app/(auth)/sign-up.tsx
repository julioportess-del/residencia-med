import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useAuthSession } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { cores, espacamento, fontes, layout, radii } from '@/lib/theme'

export default function SignUpScreen() {
  const { signUp } = useAuthSession()
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [aguardandoCodigo, setAguardandoCodigo] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const onCriar = async () => {
    if (senha.length < 8) {
      Alert.alert('Senha', 'Pelo menos 8 caracteres.')
      return
    }
    setCarregando(true)
    const { erro } = await signUp(email, senha, nome)
    setCarregando(false)
    if (erro) {
      Alert.alert('Erro', erro)
      return
    }
    // Se confirmação de email estiver desligada, sessão é criada na hora
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      router.replace('/(app)')
    } else {
      setAguardandoCodigo(true)
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
            ? `Enviamos um link de confirmação para ${email}. Abra o e-mail para ativar a conta.`
            : 'Comece de graça, sem cartão de crédito.'}
        </Text>

        {!aguardandoCodigo ? (
          <>
            <View style={styles.campo}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                value={nome}
                onChangeText={setNome}
                placeholder="Seu nome"
                style={styles.input}
              />
            </View>
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
                placeholder="mínimo 8 caracteres"
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
          <Link href="/(auth)/sign-in" style={styles.link}>
            Voltar para entrar
          </Link>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  box: { flex: 1, padding: espacamento.lg, justifyContent: 'center', gap: espacamento.md },
  titulo: { fontSize: fontes.size['3xl'], fontWeight: fontes.weight.bold, color: cores.foreground },
  subtitulo: {
    fontSize: fontes.size.md,
    color: cores.mutedForeground,
    marginBottom: espacamento.md,
  },
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
