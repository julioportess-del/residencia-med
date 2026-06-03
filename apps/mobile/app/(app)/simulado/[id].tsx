import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { trpc } from '@/lib/trpc'
import { cores, espacamento, fontes, layout, radii } from '@/lib/theme'

export default function SimuladoExecScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const sessao = trpc.sessao.detalhe.useQuery({ id: id! }, { enabled: Boolean(id) })

  const config = sessao.data?.configuracao as
    | { questaoIds: string[]; tempoMinutos?: number }
    | undefined
  const questaoIds = config?.questaoIds ?? []

  const [idx, setIdx] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [restanteSec, setRestanteSec] = useState(0)
  const [iniciado, setIniciado] = useState(false)

  useEffect(() => {
    if (config?.tempoMinutos && !iniciado) {
      setRestanteSec(config.tempoMinutos * 60)
      setIniciado(true)
    }
  }, [config, iniciado])

  useEffect(() => {
    if (!iniciado || restanteSec <= 0) return
    const t = setInterval(() => setRestanteSec((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [iniciado, restanteSec])

  const idAtual = questaoIds[idx]
  const questao = trpc.questao.detalhe.useQuery(
    { id: idAtual ?? '' },
    { enabled: Boolean(idAtual) },
  )
  const responder = trpc.questao.responder.useMutation()
  const finalizar = trpc.sessao.finalizar.useMutation({
    onSuccess: () => router.replace(`/(app)/simulado/${id}/resultado` as never),
  })

  const onProxima = async () => {
    if (idAtual && respostas[idAtual]) {
      try {
        await responder.mutateAsync({
          questaoId: idAtual,
          alternativaLetra: respostas[idAtual] as never,
          tempoSegundos: 60,
          confianca: 'INCERTO',
          sessaoId: id,
        })
      } catch {
        Alert.alert('Erro', 'Falha ao salvar resposta')
        return
      }
    }
    if (idx < questaoIds.length - 1) setIdx(idx + 1)
    else finalizar.mutate({ id: id! })
  }

  if (sessao.isLoading || !sessao.data) {
    return (
      <View style={layout.centered}>
        <ActivityIndicator />
      </View>
    )
  }

  if (questaoIds.length === 0) return <Text>Sessão inválida</Text>

  const min = Math.floor(restanteSec / 60)
  const seg = restanteSec % 60

  return (
    <ScrollView
      contentContainerStyle={[layout.scrollContent, { paddingBottom: espacamento['2xl'] }]}
    >
      <View style={layout.rowBetween}>
        <Text style={styles.contador}>
          Questão {idx + 1} de {questaoIds.length}
        </Text>
        <View
          style={[
            styles.timer,
            restanteSec < 60 && { backgroundColor: '#fef2f2', borderColor: cores.destructive },
          ]}
        >
          <Text style={styles.timerTexto}>
            {min.toString().padStart(2, '0')}:{seg.toString().padStart(2, '0')}
          </Text>
        </View>
      </View>

      {questao.isLoading || !questao.data ? (
        <ActivityIndicator />
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: espacamento.sm }}>
            <Badge bg={questao.data.banca.cor ?? cores.primary}>{questao.data.banca.codigo}</Badge>
            <Text style={{ fontSize: fontes.size.sm, color: cores.mutedForeground }}>
              {questao.data.ano}
            </Text>
          </View>
          {questao.data.enunciadoVignette && (
            <Card>
              <Text style={styles.vignette}>{questao.data.enunciadoVignette}</Text>
            </Card>
          )}
          <Text style={styles.enunciado}>{questao.data.enunciado}</Text>

          {questao.data.alternativas.map((a) => {
            const sel = idAtual ? respostas[idAtual] === a.letra : false
            return (
              <Pressable
                key={a.id}
                onPress={() => idAtual && setRespostas({ ...respostas, [idAtual]: a.letra })}
                style={[styles.alternativa, sel && styles.alternativaSel]}
              >
                <Text style={styles.letra}>{a.letra}</Text>
                <Text style={styles.texto}>{a.texto}</Text>
              </Pressable>
            )
          })}

          <View style={layout.rowBetween}>
            <Button
              variant="outline"
              onPress={() => setIdx(Math.max(0, idx - 1))}
              disabled={idx === 0}
            >
              Anterior
            </Button>
            <Button onPress={onProxima} loading={responder.isPending || finalizar.isPending}>
              {idx === questaoIds.length - 1 ? 'Finalizar' : 'Próxima'}
            </Button>
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  contador: { fontSize: fontes.size.sm, color: cores.mutedForeground },
  timer: {
    paddingHorizontal: espacamento.sm,
    paddingVertical: 4,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: cores.border,
  },
  timerTexto: {
    fontFamily: 'Menlo',
    fontWeight: fontes.weight.bold,
    fontSize: fontes.size.md,
    color: cores.foreground,
  },
  vignette: { fontSize: fontes.size.md, lineHeight: 22, color: cores.foreground },
  enunciado: {
    fontSize: fontes.size.md,
    lineHeight: 22,
    fontWeight: fontes.weight.medium,
    color: cores.foreground,
  },
  alternativa: {
    flexDirection: 'row',
    gap: espacamento.sm,
    padding: espacamento.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: cores.border,
  },
  alternativaSel: { borderColor: cores.primary, borderWidth: 2 },
  letra: {
    fontSize: fontes.size.md,
    fontWeight: fontes.weight.bold,
    color: cores.foreground,
    width: 20,
  },
  texto: { fontSize: fontes.size.md, color: cores.foreground, flex: 1, lineHeight: 22 },
})
