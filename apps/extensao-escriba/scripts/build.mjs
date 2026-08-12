import { build } from 'esbuild'
import { cpSync, mkdirSync } from 'node:fs'

// Bundla cada entrada da extensão (MV3) e copia os estáticos para dist/.
mkdirSync('dist', { recursive: true })

await build({
  entryPoints: [
    'src/background.ts',
    'src/content.ts',
    'src/offscreen.ts',
    'src/popup.ts',
    'src/options.ts',
  ],
  bundle: true,
  format: 'esm',
  target: 'chrome120',
  outdir: 'dist',
  logLevel: 'info',
})

cpSync('static', 'dist', { recursive: true })
