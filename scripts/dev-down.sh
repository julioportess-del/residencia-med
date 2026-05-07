#!/bin/bash
# Para web, workers e containers (mantém os dados em volumes).
set -e
cd "$(dirname "$0")/.."

# Mata processos do dev server
if [ -f /tmp/workers.pid ]; then
  kill "$(cat /tmp/workers.pid)" 2>/dev/null || true
  rm /tmp/workers.pid
fi
pkill -f "next dev" 2>/dev/null || true

# Containers
docker-compose down

echo "✓ Stack parada (dados preservados nos volumes)."
echo "  Para parar Colima também: colima stop"
