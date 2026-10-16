#!/usr/bin/env bash
# Grava a ANTHROPIC_API_KEY em apps/workers/.env sem exibir a chave.
# Uso: bash scripts/salvar-chave-anthropic.sh
set -euo pipefail

ARQUIVO="$(cd "$(dirname "$0")/.." && pwd)/apps/workers/.env"

printf 'Cole a chave de API (sk-ant-api03-… ou sk-ant-usr-…) e tecle Enter: '
IFS= read -rs CHAVE
echo

# Formatos aceitos: chave de workspace (sk-ant-api03-…) e chave pessoal (sk-ant-usr-…)
if [[ ! "$CHAVE" =~ ^sk-ant-(api[0-9]{2}|usr)-[A-Za-z0-9_-]{20,}$ ]]; then
  echo "Isso não parece uma chave de API da Anthropic. Nada foi gravado."
  echo "Dica: o Bloco de Notas pode trocar '--' por '—'. Copie a chave direto do console."
  exit 1
fi

if grep -q '^ANTHROPIC_API_KEY=' "$ARQUIVO"; then
  TMP="$(mktemp)"
  awk -v k="$CHAVE" '/^ANTHROPIC_API_KEY=/{print "ANTHROPIC_API_KEY=\"" k "\""; next} {print}' "$ARQUIVO" >"$TMP"
  cat "$TMP" >"$ARQUIVO"
  rm -f "$TMP"
else
  printf 'ANTHROPIC_API_KEY="%s"\n' "$CHAVE" >>"$ARQUIVO"
fi
echo "Gravada em: $ARQUIVO ($(date '+%H:%M:%S'))"

# Teste gratuito (lista modelos; não gera cobrança)
RESPOSTA="$(curl -s 'https://api.anthropic.com/v1/models?limit=1' -H "x-api-key: $CHAVE" -H 'anthropic-version: 2023-06-01')"
unset CHAVE
if printf '%s' "$RESPOSTA" | grep -q '"data"'; then
  echo "✅ Chave funcionando. Pode avisar o Claude."
else
  echo "❌ A Anthropic recusou a chave: $(printf '%s' "$RESPOSTA" | grep -o '"message":"[^"]*"' | head -1)"
  echo "   Confira se a chave está ativa em platform.claude.com > Chaves de API."
  exit 1
fi
