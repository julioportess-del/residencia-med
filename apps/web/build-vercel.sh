#!/bin/bash
# Build pro Vercel: roda do apps/web mas precisa fazer pnpm filter da raiz.
# Workaround pro Prisma + pnpm symlinks: copia engine binary pra um caminho
# que o output tracing do Next encontra.
set -e
cd ../..
pnpm --filter @residencia-med/db exec prisma generate
mkdir -p apps/web/node_modules/.prisma/client
cp -r node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/* apps/web/node_modules/.prisma/client/ 2>/dev/null || true
pnpm --filter @residencia-med/web build
