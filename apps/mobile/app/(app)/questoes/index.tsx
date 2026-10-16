import { useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { trpc } from '@/lib/trpc'
import { cores, espacamento, fontes, layout } from '@/lib/theme'

const COR_DIFICULDADE: Record<string, string> = {
  FACIL: cores.success,
  MEDIO: cores.warning,
  DIFICIL: cores.destructive,
  MUITO_DIFICIL: '#7c0024',
}

export default function QuestoesScreen() {
  const router = useRouter()
  const { data, isLoading } = trpc.questao.listar.useQuery({
    limit: 30,
    situacao: 'TODAS' as const,
  })

  if (isLoading) {
    return (
      <View style={layout.centered}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <FlatList
      style={layout.container}
      contentContainerStyle={[layout.scrollContent, { gap: espacamento.sm }]}
      data={data?.itens ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/questoes/${item.id}`)}>
          <Card>
            <View style={styles.linhaTop}>
              <Badge bg={item.banca.cor ?? cores.primary}>{item.banca.codigo}</Badge>
              <Text style={styles.ano}>{item.ano}</Text>
              <View style={{ flex: 1 }} />
              <Badge bg={COR_DIFICULDADE[item.dificuldade]}>{item.dificuldade}</Badge>
            </View>
            <Text style={styles.resumo} numberOfLines={2}>
              {item.resumo}…
            </Text>
            <View style={styles.linhaBot}>
              {item.temaPrincipal && <Text style={styles.tema}>{item.temaPrincipal.nome}</Text>}
              {item.jaRespondida && (
                <Text style={[styles.tema, { color: cores.success }]}>respondida</Text>
              )}
            </View>
          </Card>
        </Pressable>
      )}
      ListEmptyComponent={
        <Text style={{ textAlign: 'center', color: cores.mutedForeground }}>
          Nenhuma questão encontrada.
        </Text>
      }
    />
  )
}

const styles = StyleSheet.create({
  linhaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacamento.sm,
  },
  ano: {
    fontSize: fontes.size.xs,
    color: cores.mutedForeground,
  },
  resumo: {
    fontSize: fontes.size.md,
    color: cores.foreground,
    marginTop: espacamento.sm,
    lineHeight: 20,
  },
  linhaBot: {
    flexDirection: 'row',
    gap: espacamento.sm,
    marginTop: espacamento.xs,
  },
  tema: {
    fontSize: fontes.size.xs,
    color: cores.mutedForeground,
  },
})
