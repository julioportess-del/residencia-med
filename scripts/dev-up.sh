#!/bin/bash
# Sobe a infra local (Postgres + Redis) e inicia a aplicação web.
# Uso: ./scripts/dev-up.sh
set -e
cd "$(dirname "$0")/.."

echo "▶ Iniciando Colima..."
colima status >/dev/null 2>&1 || colima start --cpu 2 --memory 4 --disk 20

echo "▶ Subindo Postgres + Redis..."
docker-compose up -d

echo "▶ Aguardando Postgres ficar pronto..."
until docker exec residencia-postgres pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done

if [ ! -f .env ]; then
  echo "▶ Criando .env a partir do .env.example..."
  cp .env.example .env
fi

echo "▶ Aplicando migrations..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/residencia_med?schema=public" \
  pnpm --filter @residencia-med/db exec prisma migrate deploy

echo "▶ Pronto! Iniciando dev server..."
echo "   App:      http://localhost:3000"
echo "   Login:    automático via DEV_USER_EMAIL no .env"
echo ""
pnpm --filter @residencia-med/web dev
