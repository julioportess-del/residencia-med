import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuthSession } from '@/lib/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc'
import { cores, espacamento, fontes, layout } from '@/lib/theme'

export default function HomeScreen() {
  const router = useRouter()
  const { user } = useAuthSession()
  const status = trpc.onboarding.status.useQuery()
  const resumo = trpc.dashboard.resumo.useQuery(undefined, {
    enabled: status.data?.completo === true,
  })
  const revisao = trpc.revisao.contagem.useQuery(undefined, {
    enabled: status.data?.completo === true,
  })

  useEffect(() => {
    if (status.data && !status.data.completo) {
      router.replace('/onboarding' as never)
    }
  }, [status.data, router])

  if (status.isLoading || status.data?.completo === false) {
    return (
      <View style={layout.centered}>
        <ActivityIndicator size="large" color={cores.primary} />
      </View>
    )
  }

  const nome =
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split('@')[0] ??
    ''

  return (
    <ScrollView contentContainerStyle={[layout.scrollContent, { paddingBottom: espacamento['2xl'] }]}>
      <View>
        <Text style={styles.saudacao}>Olá{nome ? `, ${nome}` : ''} 👋</Text>
        <Text style={styles.subSaudacao}>Pronto para mais uma sessão?</Text>
      </View>

      {revisao.data && revisao.data.vencidos > 0 && (
        <Card style={{ borderColor: cores.warning, borderWidth: 1.5 }}>
          <View style={layout.rowBetween}>
            <View>
              <Badge variant="warning">Revisão</Badge>
              <Text style={styles.cardLabel}>
                {revisao.data.vencidos} {revisao.data.vencidos === 1 ? 'item vencido' : 'itens vencidos'}
              </Text>
            </View>
            <Button onPress={() => router.push('/revisao')} size="sm">
              Revisar
            </Button>
          </View>
        </Card>
      )}

      <View style={styles.kpiGrid}>
        <Kpi
          label="Respostas"
          valor={resumo.data?.totalRespostas ?? '—'}
          loading={resumo.isLoading}
        />
        <Kpi
          label="Acerto"
          valor={resumo.data ? `${Math.round(resumo.data.taxaAcerto * 100)}%` : '—'}
          loading={resumo.isLoading}
        />
        <Kpi
          label="Streak"
          valor={resumo.data ? `${resumo.data.streak}d` : '—'}
          loading={resumo.isLoading}
        />
      </View>

      <Card>
        <CardTitle>O que você quer fazer agora?</CardTitle>
        <View style={{ gap: espacamento.sm }}>
          <Button onPress={() => router.push('/simulado')} size="lg">
            Iniciar simulado
          </Button>
          <Button onPress={() => router.push('/questoes')} size="lg" variant="outline">
            Estudar por tema
          </Button>
        </View>
      </Card>
    </ScrollView>
  )
}

function Kpi({
  label,
  valor,
  loading,
}: {
  label: string
  valor: string | number
  loading?: boolean
}) {
  return (
    <View style={[layout.card, styles.kpi]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <Text style={styles.kpiValor}>{valor}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  saudacao: {
    fontSize: fontes.size['2xl'],
    fontWeight: fontes.weight.bold,
    color: cores.foreground,
  },
  subSaudacao: {
    fontSize: fontes.size.md,
    color: cores.mutedForeground,
    marginTop: espacamento.xs,
  },
  cardLabel: {
    marginTop: espacamento.xs,
    fontSize: fontes.size.md,
    fontWeight: fontes.weight.medium,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  kpi: {
    flex: 1,
    alignItems: 'flex-start',
    gap: espacamento.xs,
  },
  kpiLabel: {
    fontSize: fontes.size.xs,
    color: cores.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValor: {
    fontSize: fontes.size.xl,
    fontWeight: fontes.weight.bold,
    color: cores.foreground,
  },
})
