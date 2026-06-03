import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc'
import { cores, espacamento, fontes, layout, radii } from '@/lib/theme'

export default function NovoSimuladoScreen() {
  const router = useRouter()
  const bancas = trpc.banca.listar.useQuery()
  const [bancaId, setBancaId] = useState<string | null>(null)
  const [nQuestoes, setNQuestoes] = useState('20')
  const [tempoMin, setTempoMin] = useState('40')

  const criar = trpc.sessao.criar.useMutation({
    onSuccess: ({ sessaoId }) => router.push(`/simulado/${sessaoId}`),
    onError: (e) => Alert.alert('Erro', e.message ?? 'Falha ao criar simulado'),
  })

  return (
    <ScrollView
      contentContainerStyle={[layout.scrollContent, { paddingBottom: espacamento['2xl'] }]}
    >
      <Card>
        <CardTitle>Configuração</CardTitle>
        <CardDescription>
          Selecione banca (opcional), número de questões e tempo. Cronômetro inicia ao tocar
          Iniciar.
        </CardDescription>

        <View style={styles.campo}>
          <Text style={styles.label}>Banca</Text>
          <View style={styles.bancasGrid}>
            <BancaPill
              ativo={bancaId === null}
              onPress={() => setBancaId(null)}
              cor={cores.primary}
            >
              Todas
            </BancaPill>
            {bancas.data?.map((b) => (
              <BancaPill
                key={b.id}
                ativo={bancaId === b.id}
                onPress={() => setBancaId(b.id)}
                cor={b.cor ?? cores.primary}
              >
                {b.codigo}
              </BancaPill>
            ))}
          </View>
        </View>

        <View style={styles.linha}>
          <View style={[styles.campo, { flex: 1 }]}>
            <Text style={styles.label}>Número de questões</Text>
            <TextInput
              value={nQuestoes}
              onChangeText={setNQuestoes}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
          <View style={[styles.campo, { flex: 1 }]}>
            <Text style={styles.label}>Tempo (min)</Text>
            <TextInput
              value={tempoMin}
              onChangeText={setTempoMin}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </View>

        <Button
          size="lg"
          onPress={() =>
            criar.mutate({
              tipo: 'SIMULADO',
              bancaId: bancaId ?? undefined,
              filtros: bancaId ? { bancaIds: [bancaId] } : {},
              numeroQuestoes: Number(nQuestoes) || 20,
              tempoMinutos: Number(tempoMin) || 40,
            })
          }
          loading={criar.isPending}
        >
          Iniciar simulado
        </Button>
      </Card>
    </ScrollView>
  )
}

function BancaPill({
  children,
  ativo,
  onPress,
  cor,
}: {
  children: React.ReactNode
  ativo: boolean
  onPress: () => void
  cor: string
}) {
  return (
    <View>
      <View
        onTouchEnd={onPress}
        style={{
          paddingHorizontal: espacamento.sm,
          paddingVertical: 6,
          borderRadius: radii.full,
          backgroundColor: ativo ? cor : 'transparent',
          borderColor: cor,
          borderWidth: 1,
        }}
      >
        <Badge bg={ativo ? cor : 'transparent'} variant={ativo ? 'default' : 'outline'}>
          {children}
        </Badge>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
  linha: { flexDirection: 'row', gap: espacamento.sm },
  bancasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: espacamento.xs },
})
