import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native'
import { cores, espacamento, fontes, radii } from '@/lib/theme'

type Variant = 'primary' | 'outline' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

type Props = {
  children: React.ReactNode
  onPress?: () => void
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
}: Props) {
  const inativo = disabled || loading
  const variantStyle = stylesVariant[variant]
  const sizeStyle = stylesSize[size]
  return (
    <Pressable
      onPress={inativo ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle.button,
        sizeStyle.button,
        inativo && { opacity: 0.5 },
        pressed && !inativo && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text.color} size="small" />
      ) : (
        <Text style={[variantStyle.text, sizeStyle.text]}>{children}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    gap: espacamento.xs,
  },
})

const stylesVariant = {
  primary: StyleSheet.create({
    button: { backgroundColor: cores.primary },
    text: { color: '#fff', fontWeight: fontes.weight.semibold },
  }),
  outline: StyleSheet.create({
    button: { backgroundColor: 'transparent', borderWidth: 1, borderColor: cores.border },
    text: { color: cores.foreground, fontWeight: fontes.weight.medium },
  }),
  ghost: StyleSheet.create({
    button: { backgroundColor: 'transparent' },
    text: { color: cores.foreground, fontWeight: fontes.weight.medium },
  }),
  destructive: StyleSheet.create({
    button: { backgroundColor: cores.destructive },
    text: { color: '#fff', fontWeight: fontes.weight.semibold },
  }),
}

const stylesSize = {
  sm: StyleSheet.create({
    button: { paddingHorizontal: espacamento.md, paddingVertical: espacamento.sm, minHeight: 36 },
    text: { fontSize: fontes.size.sm },
  }),
  md: StyleSheet.create({
    button: {
      paddingHorizontal: espacamento.md,
      paddingVertical: espacamento.sm + 4,
      minHeight: 44,
    },
    text: { fontSize: fontes.size.md },
  }),
  lg: StyleSheet.create({
    button: { paddingHorizontal: espacamento.lg, paddingVertical: espacamento.md, minHeight: 52 },
    text: { fontSize: fontes.size.lg },
  }),
}
