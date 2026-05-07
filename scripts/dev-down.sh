#!/bin/bash
# Para os containers (mantém os dados em volumes).
set -e
cd "$(dirname "$0")/.."
docker-compose down
echo "Stack parada. Para parar Colima também: colima stop"
