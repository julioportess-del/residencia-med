import { useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc'
import { cores, espacamento, fontes, layout } from '@/lib/theme'

export default function RevisaoScreen() {
  const router = useRouter()
  const { data, isLoading } = trpc.revisao.itensVencidos.useQuery()
  const contagem = trpc.revisao.contagem.useQuery()

  if (isLoading) {
    return (
      <View style={layout.centered}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!data || data.length === 0) {
    return (
      <View style={layout.centered}>
        <Card>
          <CardTitle>Tudo em dia</CardTitle>
          <Text style={{ color: cores.mutedForeground }}>
            {contagem.data?.total
              ? `Você tem ${contagem.data.total} itens em revisão espaçada — próximos vão aparecer aqui.`
              : 'Responda algumas questões para alimentar a revisão.'}
          </Text>
        </Card>
      </View>
    )
  }

  return (
    <FlatList
      style={layout.container}
      contentContainerStyle={[layout.scrollContent, { gap: espacamento.sm }]}
      data={data}
      keyExtractor={(i) => i.id}
      ListHeaderComponent={
        <Text style={{ color: cores.mutedForeground }}>
          {data.length} {data.length === 1 ? 'item' : 'itens'} para revisar hoje
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/questoes/${item.questaoId}`)}>
          <Card>
            <View style={styles.linhaTop}>
              <Badge bg={item.questao.banca.cor ?? cores.primary}>
                {item.questao.banca.codigo}
              </Badge>
              <Text style={styles.meta}>{item.questao.ano}</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.meta}>repetição {item.repeticoes}</Text>
            </View>
            <Text style={styles.resumo} numberOfLines={2}>
              {item.questao.resumo}…
            </Text>
            {item.questao.tema && <Text style={styles.tema}>{item.questao.tema.nome}</Text>}
          </Card>
        </Pressable>
      )}
    />
  )
}

const styles = StyleSheet.create({
  linhaTop: { flexDirection: 'row', alignItems: 'center', gap: espacamento.sm },
  meta: { fontSize: fontes.size.xs, color: cores.mutedForeground },
  resumo: {
    fontSize: fontes.size.md,
    color: cores.foreground,
    lineHeight: 20,
    marginTop: espacamento.sm,
  },
  tema: { fontSize: fontes.size.xs, color: cores.mutedForeground, marginTop: espacamento.xs },
})
