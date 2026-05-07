#!/bin/bash
# Repopula o banco com bancas, temas, guidelines e questões de exemplo.
set -e
cd "$(dirname "$0")/.."
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/residencia_med?schema=public" \
  pnpm --filter @residencia-med/db db:seed
