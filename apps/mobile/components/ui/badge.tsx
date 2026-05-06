import { StyleSheet, Text, View } from 'react-native'
import { cores, espacamento, fontes, radii } from '@/lib/theme'

type Variant = 'default' | 'success' | 'warning' | 'destructive' | 'outline'

const cor: Record<Variant, { bg: string; fg: string; border?: string }> = {
  default: { bg: cores.primary, fg: '#fff' },
  success: { bg: cores.success, fg: '#fff' },
  warning: { bg: cores.warning, fg: '#fff' },
  destructive: { bg: cores.destructive, fg: '#fff' },
  outline: { bg: 'transparent', fg: cores.foreground, border: cores.border },
}

export function Badge({
  children,
  variant = 'default',
  bg,
}: {
  children: React.ReactNode
  variant?: Variant
  bg?: string
}) {
  const c = cor[variant]
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg ?? c.bg,
          borderColor: c.border ?? 'transparent',
          borderWidth: c.border ? 1 : 0,
        },
      ]}
    >
      <Text style={[styles.text, { color: c.fg }]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: espacamento.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  text: {
    fontSize: fontes.size.xs,
    fontWeight: fontes.weight.semibold,
  },
})
