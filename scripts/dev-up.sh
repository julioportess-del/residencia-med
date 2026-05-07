#!/bin/bash
# Sobe a infra local (Postgres + Redis) e inicia web + workers em paralelo.
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

# Sincroniza .env para apps que precisam (workers usa --env-file=.env)
cp .env apps/web/.env
cp .env apps/workers/.env

echo "▶ Aplicando migrations..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/residencia_med?schema=public" \
  pnpm --filter @residencia-med/db exec prisma migrate deploy

# Seed só se o banco estiver vazio
COUNT=$(docker exec residencia-postgres psql -U postgres residencia_med -tAc "SELECT COUNT(*) FROM \"Banca\";" 2>/dev/null || echo 0)
if [ "$COUNT" -eq 0 ]; then
  echo "▶ Banco vazio — semeando bancas, temas, questões..."
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/residencia_med?schema=public" \
    pnpm --filter @residencia-med/db db:seed
fi

echo ""
echo "✅ Infra pronta. Iniciando web (3000) + workers em paralelo..."
echo "   App:    http://localhost:3000"
echo "   Login:  automático via DEV_USER_EMAIL no .env"
echo "   Logs:   /tmp/web-dev.log e /tmp/workers.log"
echo ""

# Workers em background
pnpm --filter @residencia-med/workers dev > /tmp/workers.log 2>&1 &
WORKER_PID=$!
echo $WORKER_PID > /tmp/workers.pid
echo "▶ Workers iniciados (PID $WORKER_PID)"

# Web em foreground — Ctrl+C derruba os dois
trap "echo '▶ Encerrando...'; kill $WORKER_PID 2>/dev/null; exit" INT TERM
pnpm --filter @residencia-med/web dev
