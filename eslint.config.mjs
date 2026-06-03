import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

// Flat config compartilhada do monorepo (ESLint 9).
// Fonte única de verdade: rodada pela raiz via `pnpm lint` (eslint .).
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/.expo/**',
      '**/generated/**', // cliente Prisma gerado
      '**/public/**', // assets estáticos (ex.: service worker)
      '**/next-env.d.ts',
      '**/*.config.*',
      '**/*.cjs', // configs legadas
      '.claude/**',
      '**/worktrees/**',
    ],
  },
  // Arquivos CommonJS soltos (.js) — globals de Node (module, require, …)
  {
    files: ['**/*.js'],
    languageOptions: { globals: globals.node, sourceType: 'commonjs' },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
)
