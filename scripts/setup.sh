#!/usr/bin/env bash
# Setup local Residencia Med
# Uso: ./scripts/setup.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Verificando dependencias do sistema"
command -v pnpm >/dev/null 2>&1 || { echo "Instale pnpm: npm i -g pnpm@9.12.3"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Instale Docker"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Instale Node 20.11+"; exit 1; }

echo "==> Copiando .env.example para .env.local (se nao existir)"
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "  Edite .env.local com suas chaves de API antes de continuar"
fi

echo "==> Subindo Postgres + Redis via docker-compose"
docker compose up -d
echo "  Aguardando Postgres ficar pronto..."
sleep 3

echo "==> Instalando dependencias"
pnpm install

echo "==> Gerando Prisma Client"
pnpm --filter @residencia-med/db db:generate

echo "==> Aplicando schema"
pnpm --filter @residencia-med/db db:push

echo "==> Seedando bancas, especialidades, guidelines e questoes"
pnpm --filter @residencia-med/db db:seed

echo ""
echo "Setup concluido. Para iniciar:"
echo "  pnpm dev          # web + workers"
echo "  pnpm db:studio    # Prisma Studio em :5555"
