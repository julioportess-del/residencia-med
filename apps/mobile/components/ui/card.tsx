import { StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { cores, espacamento, fontes, radii } from '@/lib/theme'

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return <Text style={styles.description}>{children}</Text>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: cores.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: cores.border,
    padding: espacamento.md,
    gap: espacamento.sm,
  },
  title: {
    fontSize: fontes.size.lg,
    fontWeight: fontes.weight.semibold,
    color: cores.foreground,
  },
  description: {
    fontSize: fontes.size.sm,
    color: cores.mutedForeground,
  },
})
