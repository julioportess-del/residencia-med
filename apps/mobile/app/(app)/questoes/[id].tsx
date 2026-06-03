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
import { BotaoOuvir } from '@/components/botao-ouvir'
import { trpc } from '@/lib/trpc'
import { enfileirarResposta } from '@/lib/sync'
import { cores, espacamento, fontes, layout, radii } from '@/lib/theme'

type Confianca = 'CHUTE' | 'INCERTO' | 'CONFIANTE'

export default function QuestaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const questao = trpc.questao.detalhe.useQuery({ id: id! }, { enabled: Boolean(id) })

  const [escolha, setEscolha] = useState<string | null>(null)
  const [confianca, setConfianca] = useState<Confianca>('INCERTO')
  const [inicio] = useState(() => Date.now())
  const [resultado, setResultado] = useState<{
    correta: boolean
    gabaritoLetra: string
    explicacaoMd: string
  } | null>(null)

  const responder = trpc.questao.responder.useMutation({
    onSuccess: (r) => {
      setResultado({
        correta: r.correta,
        gabaritoLetra: r.gabaritoLetra,
        explicacaoMd: r.explicacaoMd,
      })
    },
    onError: async (e) => {
      // offline: enfileira local
      if (escolha) {
        await enfileirarResposta({
          id: `${Date.now()}-${Math.random()}`,
          questaoId: id!,
          alternativaLetra: escolha,
          tempoSegundos: Math.max(1, Math.floor((Date.now() - inicio) / 1000)),
          confianca,
          modoRevisao: false,
          criadoEm: new Date().toISOString(),
        })
        Alert.alert(
          'Salvo offline',
          'Sua resposta será enviada automaticamente quando voltar online.',
        )
      } else {
        Alert.alert('Erro', e.message ?? 'Falha ao registrar resposta')
      }
    },
  })

  const submeter = () => {
    if (!escolha || !id) return
    responder.mutate({
      questaoId: id,
      alternativaLetra: escolha as never,
      tempoSegundos: Math.max(1, Math.floor((Date.now() - inicio) / 1000)),
      confianca,
      modoRevisao: false,
    })
  }

  // limpar resultado quando id muda (navegação)
  useEffect(() => {
    setResultado(null)
    setEscolha(null)
    setConfianca('INCERTO')
  }, [id])

  if (questao.isLoading || !questao.data) {
    return (
      <View style={layout.centered}>
        <ActivityIndicator />
      </View>
    )
  }

  const q = questao.data

  return (
    <ScrollView
      contentContainerStyle={[layout.scrollContent, { paddingBottom: espacamento['2xl'] }]}
    >
      <View style={styles.cabecalho}>
        <Badge bg={q.banca.cor ?? cores.primary}>{q.banca.codigo}</Badge>
        <Text style={styles.metaTexto}>{q.ano}</Text>
        <View style={{ flex: 1 }} />
        <BotaoOuvir
          vignette={q.enunciadoVignette}
          enunciado={q.enunciado}
          alternativas={q.alternativas.map((a) => ({ letra: a.letra, texto: a.texto }))}
        />
      </View>

      {q.enunciadoVignette && (
        <Card>
          <Text style={styles.vignette}>{q.enunciadoVignette}</Text>
        </Card>
      )}

      <Text style={styles.enunciado}>{q.enunciado}</Text>

      {q.alternativas.map((a) => {
        const ehGabarito = resultado && a.letra === resultado.gabaritoLetra
        const ehErrada = resultado && a.letra === escolha && !resultado.correta
        const desabilitado = !!resultado
        return (
          <Pressable
            key={a.id}
            onPress={() => !desabilitado && setEscolha(a.letra)}
            disabled={desabilitado}
            style={[
              styles.alternativa,
              escolha === a.letra && !resultado && styles.alternativaSelecionada,
              ehGabarito && styles.alternativaCorreta,
              ehErrada && styles.alternativaErrada,
            ]}
          >
            <Text style={styles.letraAlternativa}>{a.letra}</Text>
            <Text style={styles.textoAlternativa}>{a.texto}</Text>
          </Pressable>
        )
      })}

      {!resultado && (
        <Card>
          <Text style={styles.confiancaLabel}>Você está...</Text>
          <View style={styles.confiancaRow}>
            {(['CHUTE', 'INCERTO', 'CONFIANTE'] as const).map((c) => (
              <Button
                key={c}
                variant={confianca === c ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setConfianca(c)}
              >
                {c === 'CHUTE' ? 'Chutando' : c === 'INCERTO' ? 'Incerto' : 'Confiante'}
              </Button>
            ))}
          </View>
        </Card>
      )}

      {!resultado ? (
        <Button onPress={submeter} loading={responder.isPending} size="lg" disabled={!escolha}>
          Confirmar resposta
        </Button>
      ) : (
        <>
          <Card
            style={{
              borderColor: resultado.correta ? cores.success : cores.destructive,
              borderWidth: 1.5,
            }}
          >
            <Text
              style={{
                fontWeight: fontes.weight.bold,
                color: resultado.correta ? cores.success : cores.destructive,
              }}
            >
              {resultado.correta
                ? '✓ Resposta correta'
                : `✗ Errou — gabarito ${resultado.gabaritoLetra}`}
            </Text>
          </Card>
          <Card>
            <Text style={styles.explicacao}>{resultado.explicacaoMd}</Text>
          </Card>
          <Button onPress={() => router.back()} variant="outline">
            Voltar ao banco
          </Button>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espacamento.sm },
  metaTexto: { fontSize: fontes.size.sm, color: cores.mutedForeground },
  vignette: { fontSize: fontes.size.md, color: cores.foreground, lineHeight: 22 },
  enunciado: {
    fontSize: fontes.size.md,
    color: cores.foreground,
    fontWeight: fontes.weight.medium,
    lineHeight: 22,
  },
  alternativa: {
    flexDirection: 'row',
    gap: espacamento.sm,
    padding: espacamento.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: cores.border,
    backgroundColor: cores.background,
  },
  alternativaSelecionada: { borderColor: cores.primary, borderWidth: 2 },
  alternativaCorreta: { borderColor: cores.success, backgroundColor: '#ecfdf5' },
  alternativaErrada: { borderColor: cores.destructive, backgroundColor: '#fef2f2' },
  letraAlternativa: {
    fontSize: fontes.size.md,
    fontWeight: fontes.weight.bold,
    color: cores.foreground,
    width: 20,
  },
  textoAlternativa: { fontSize: fontes.size.md, color: cores.foreground, flex: 1, lineHeight: 22 },
  confiancaLabel: {
    fontSize: fontes.size.sm,
    fontWeight: fontes.weight.medium,
    color: cores.foreground,
  },
  confiancaRow: { flexDirection: 'row', gap: espacamento.xs },
  explicacao: { fontSize: fontes.size.sm, color: cores.foreground, lineHeight: 20 },
})
