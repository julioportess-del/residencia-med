import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuthSession } from '@/lib/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc'
import { listarFila, sincronizarFila } from '@/lib/sync'
import { cores, espacamento, fontes, layout } from '@/lib/theme'

const COR_PLANO: Record<string, string> = {
  FREE: cores.muted,
  PRO: cores.primary,
  PREMIUM: cores.warning,
}

export default function ContaScreen() {
  const router = useRouter()
  const { signOut, user } = useAuthSession()
  const meu = trpc.billing.meuPlano.useQuery()
  const uso = trpc.billing.uso.useQuery()
  const utils = trpc.useUtils()
  const responder = trpc.questao.responder.useMutation()
  const [pendentes, setPendentes] = useState<number | null>(null)
  const [sincronizando, setSincronizando] = useState(false)

  // sincronização manual da fila
  const sincronizar = async () => {
    setSincronizando(true)
    try {
      const r = await sincronizarFila(async (item) => {
        try {
          await responder.mutateAsync({
            questaoId: item.questaoId,
            alternativaLetra: item.alternativaLetra as never,
            tempoSegundos: item.tempoSegundos,
            confianca: item.confianca,
            sessaoId: item.sessaoId,
            modoRevisao: item.modoRevisao,
          })
          return { enviado: true, persistente: false }
        } catch (e) {
          const status = (e as { data?: { httpStatus?: number } }).data?.httpStatus
          if (status && status < 500) return { enviado: false, persistente: false }
          return { enviado: false, persistente: true }
        }
      })
      setPendentes(r.pendentes)
      Alert.alert('Sincronização', `${r.enviadas} enviada(s), ${r.pendentes} pendente(s).`)
      await utils.dashboard.invalidate()
    } finally {
      setSincronizando(false)
    }
  }

  const verificarPendentes = async () => {
    const fila = await listarFila()
    setPendentes(fila.length)
  }

  return (
    <ScrollView contentContainerStyle={[layout.scrollContent, { paddingBottom: espacamento['2xl'] }]}>
      <Card>
        <CardTitle>{user?.email ?? 'Conta'}</CardTitle>
        <CardDescription>Plano, sincronização e logout.</CardDescription>

        <View style={layout.rowBetween}>
          <Text style={styles.label}>Plano</Text>
          <Badge bg={COR_PLANO[meu.data?.plano ?? 'FREE']}>{meu.data?.plano ?? '...'}</Badge>
        </View>

        {uso.data && (
          <View style={{ gap: espacamento.xs }}>
            <UsoLinha label="Questões/mês" valor={uso.data.questoesMes} />
            <UsoLinha label="Simulados/semana" valor={uso.data.simuladosSemana} />
            <UsoLinha label="IA/mês" valor={uso.data.iaMes} />
          </View>
        )}
      </Card>

      <Card>
        <CardTitle>Sincronização offline</CardTitle>
        <CardDescription>
          Respostas feitas sem internet ficam em fila local. Sincronize manualmente a qualquer momento.
        </CardDescription>
        <View style={{ flexDirection: 'row', gap: espacamento.sm }}>
          <Button variant="outline" size="sm" onPress={verificarPendentes}>
            Verificar fila
          </Button>
          <Button onPress={sincronizar} loading={sincronizando} size="sm">
            Sincronizar agora
          </Button>
        </View>
        {pendentes !== null && (
          <Text style={{ fontSize: fontes.size.sm, color: cores.mutedForeground }}>
            {pendentes} resposta(s) pendente(s).
          </Text>
        )}
      </Card>

      <Button
        variant="destructive"
        onPress={() => {
          Alert.alert('Sair', 'Tem certeza?', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Sair',
              style: 'destructive',
              onPress: async () => {
                await signOut()
                router.replace('/(auth)/sign-in')
              },
            },
          ])
        }}
      >
        Sair
      </Button>
    </ScrollView>
  )
}

function UsoLinha({ label, valor }: { label: string; valor: number }) {
  return (
    <View style={layout.rowBetween}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  label: { fontSize: fontes.size.sm, color: cores.mutedForeground },
  valor: { fontSize: fontes.size.md, fontWeight: fontes.weight.medium, color: cores.foreground },
})
