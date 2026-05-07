import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc'
import { cores, espacamento, fontes, layout, radii } from '@/lib/theme'

const PASSOS = ['Bancas', 'Data', 'Carga', 'Revisão'] as const

export default function OnboardingScreen() {
  const router = useRouter()
  const utils = trpc.useUtils()
  const bancas = trpc.banca.listar.useQuery()
  const completar = trpc.onboarding.completar.useMutation({
    onSuccess: async () => {
      await utils.onboarding.status.invalidate()
      router.replace('/')
    },
    onError: (e) => Alert.alert('Erro', e.message),
  })

  const [passo, setPasso] = useState(0)
  const [bancasAlvo, setBancasAlvo] = useState<string[]>([])
  const [dataProva, setDataProva] = useState('') // YYYY-MM-DD
  const [cargaSemanal, setCargaSemanal] = useState('20')

  const carga = Number(cargaSemanal) || 0
  const dataValida = (() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataProva)) return false
    const d = new Date(`${dataProva}T00:00:00`)
    return d.getTime() > Date.now()
  })()

  function alternarBanca(id: string) {
    setBancasAlvo((atuais) => {
      if (atuais.includes(id)) return atuais.filter((x) => x !== id)
      if (atuais.length >= 5) return atuais
      return [...atuais, id]
    })
  }

  function avancar() {
    if (passo === 0 && bancasAlvo.length === 0) {
      Alert.alert('Selecione ao menos 1 banca')
      return
    }
    if (passo === 1 && !dataValida) {
      Alert.alert('Data inválida', 'Use formato AAAA-MM-DD e escolha uma data futura.')
      return
    }
    if (passo === 2 && (carga < 2 || carga > 80)) {
      Alert.alert('Carga inválida', 'Entre 2 e 80 horas por semana.')
      return
    }
    setPasso((p) => Math.min(p + 1, PASSOS.length - 1))
  }

  function voltar() {
    setPasso((p) => Math.max(0, p - 1))
  }

  function submeter() {
    completar.mutate({
      bancasAlvo,
      dataProva: new Date(`${dataProva}T00:00:00`),
      cargaHorariaSemanal: carga,
      autoavaliacao: {},
    })
  }

  return (
    <ScrollView contentContainerStyle={layout.scrollContent}>
      <View>
        <Text style={styles.titulo}>Vamos personalizar seu plano</Text>
        <Text style={styles.sub}>4 passos rápidos — leva menos de 1 minuto.</Text>
      </View>

      <Indicador passo={passo} />

      {passo === 0 && (
        <Card>
          <CardTitle>Quais bancas você vai prestar?</CardTitle>
          <Text style={styles.dica}>Selecione até 5. A primeira é a sua meta principal.</Text>
          {bancas.isLoading ? (
            <ActivityIndicator />
          ) : (
            <View style={{ gap: espacamento.xs }}>
              {bancas.data?.map((b) => {
                const ativo = bancasAlvo.includes(b.id)
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => alternarBanca(b.id)}
                    style={[
                      styles.opcao,
                      ativo && {
                        borderColor: cores.primary,
                        backgroundColor: '#eef2ff',
                      },
                    ]}
                  >
                    <View>
                      <Text style={styles.opcaoNome}>{b.nome}</Text>
                      {b.estado ? <Text style={styles.opcaoSub}>{b.estado}</Text> : null}
                    </View>
                    {ativo ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                )
              })}
            </View>
          )}
        </Card>
      )}

      {passo === 1 && (
        <Card>
          <CardTitle>Quando é a prova?</CardTitle>
          <Text style={styles.dica}>Use o formato AAAA-MM-DD (ex: 2026-11-15).</Text>
          <TextInput
            value={dataProva}
            onChangeText={setDataProva}
            placeholder="2026-11-15"
            keyboardType="numbers-and-punctuation"
            style={styles.input}
            autoCapitalize="none"
          />
        </Card>
      )}

      {passo === 2 && (
        <Card>
          <CardTitle>Quantas horas por semana?</CardTitle>
          <Text style={styles.dica}>
            Seja realista — algo entre 10h e 40h costuma funcionar.
          </Text>
          <TextInput
            value={cargaSemanal}
            onChangeText={(t) => setCargaSemanal(t.replace(/[^0-9]/g, ''))}
            placeholder="20"
            keyboardType="number-pad"
            style={styles.input}
          />
          <Text style={styles.dica}>
            {carga > 0 ? `≈ ${(carga / 7).toFixed(1)}h/dia` : ' '}
          </Text>
        </Card>
      )}

      {passo === 3 && (
        <Card>
          <CardTitle>Confirme seus dados</CardTitle>
          <View style={{ gap: espacamento.sm, marginTop: espacamento.xs }}>
            <Resumo
              label="Bancas"
              valor={
                bancas.data
                  ? bancasAlvo
                      .map((id) => bancas.data.find((b) => b.id === id)?.nome)
                      .filter(Boolean)
                      .join(', ')
                  : '—'
              }
            />
            <Resumo label="Data da prova" valor={dataProva} />
            <Resumo label="Carga semanal" valor={`${carga}h`} />
          </View>
        </Card>
      )}

      <View style={[layout.rowBetween, { marginTop: espacamento.md }]}>
        <Button
          variant="outline"
          onPress={voltar}
          disabled={passo === 0 || completar.isPending}
        >
          Voltar
        </Button>
        {passo < PASSOS.length - 1 ? (
          <Button onPress={avancar}>Avançar</Button>
        ) : (
          <Button onPress={submeter} loading={completar.isPending}>
            Gerar meu plano
          </Button>
        )}
      </View>
    </ScrollView>
  )
}

function Indicador({ passo }: { passo: number }) {
  return (
    <View style={styles.indicador}>
      {PASSOS.map((nome, i) => {
        const ativo = i === passo
        const concluido = i < passo
        return (
          <View key={nome} style={styles.indicadorItem}>
            <View
              style={[
                styles.bolinha,
                ativo && styles.bolinhaAtiva,
                concluido && styles.bolinhaConcluida,
              ]}
            >
              <Text
                style={[
                  styles.bolinhaTexto,
                  (ativo || concluido) && { color: '#fff' },
                ]}
              >
                {i + 1}
              </Text>
            </View>
            <Text
              style={[
                styles.bolinhaRotulo,
                ativo && { color: cores.primary, fontWeight: fontes.weight.semibold },
              ]}
            >
              {nome}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

function Resumo({ label, valor }: { label: string; valor: string }) {
  return (
    <View>
      <Text style={styles.resumoLabel}>{label}</Text>
      <Text style={styles.resumoValor}>{valor || '—'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: fontes.size['2xl'],
    fontWeight: fontes.weight.bold,
    color: cores.foreground,
  },
  sub: {
    marginTop: espacamento.xs,
    fontSize: fontes.size.md,
    color: cores.mutedForeground,
  },
  dica: {
    fontSize: fontes.size.sm,
    color: cores.mutedForeground,
    marginTop: espacamento.xs,
  },
  indicador: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: espacamento.sm,
  },
  indicadorItem: {
    alignItems: 'center',
    flex: 1,
    gap: espacamento.xs,
  },
  bolinha: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: cores.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.muted,
  },
  bolinhaAtiva: {
    backgroundColor: cores.primary,
    borderColor: cores.primary,
  },
  bolinhaConcluida: {
    backgroundColor: cores.success,
    borderColor: cores.success,
  },
  bolinhaTexto: {
    fontSize: fontes.size.sm,
    fontWeight: fontes.weight.semibold,
    color: cores.mutedForeground,
  },
  bolinhaRotulo: {
    fontSize: fontes.size.xs,
    color: cores.mutedForeground,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: espacamento.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: cores.border,
  },
  opcaoNome: {
    fontSize: fontes.size.md,
    fontWeight: fontes.weight.medium,
    color: cores.foreground,
  },
  opcaoSub: {
    fontSize: fontes.size.xs,
    color: cores.mutedForeground,
    marginTop: 2,
  },
  check: {
    color: cores.primary,
    fontSize: fontes.size.lg,
    fontWeight: fontes.weight.bold,
  },
  input: {
    marginTop: espacamento.sm,
    borderWidth: 1,
    borderColor: cores.border,
    borderRadius: radii.md,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm + 2,
    fontSize: fontes.size.lg,
    color: cores.foreground,
    backgroundColor: cores.background,
  },
  resumoLabel: {
    fontSize: fontes.size.xs,
    color: cores.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resumoValor: {
    fontSize: fontes.size.md,
    color: cores.foreground,
    fontWeight: fontes.weight.medium,
    marginTop: 2,
  },
})
