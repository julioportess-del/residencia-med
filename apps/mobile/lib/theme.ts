import { StyleSheet } from 'react-native'

export const cores = {
  primary: '#1d4ed8',
  primaryHover: '#1e40af',
  destructive: '#dc2626',
  success: '#10b981',
  warning: '#f59e0b',
  background: '#ffffff',
  foreground: '#0f172a',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
  border: '#e2e8f0',
  card: '#ffffff',
  text: '#0f172a',
}

export const espacamento = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
}

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 9999,
}

export const fontes = {
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 34,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
}

export const layout = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.background,
  },
  scrollContent: {
    padding: espacamento.md,
    gap: espacamento.md,
  },
  card: {
    backgroundColor: cores.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: cores.border,
    padding: espacamento.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacamento.lg,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})
