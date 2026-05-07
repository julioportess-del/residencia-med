#!/bin/bash
# Wizard interativo para configurar credenciais externas (Supabase, Anthropic, Stripe, etc).
# Para cada serviço:
#   - abre a página de cadastro/dashboard no navegador
#   - prompts você pelas chaves
#   - valida com uma chamada de teste
#   - grava em .env (local) e opcionalmente sincroniza com Vercel
#
# Uso:
#   ./scripts/setup-creds.sh              # configura tudo, interativo
#   ./scripts/setup-creds.sh supabase     # só um serviço
#   SKIP_VERCEL=1 ./scripts/setup-creds.sh   # não pergunta sobre push pra Vercel

set -e
cd "$(dirname "$0")/.."

ENV_FILE=".env"
VERCEL_ENV_TARGET="${VERCEL_ENV_TARGET:-production preview development}"
PUSH_VERCEL=""

# Cores
B="\033[1m"; G="\033[32m"; Y="\033[33m"; R="\033[31m"; D="\033[2m"; N="\033[0m"

log()  { echo -e "${B}▶${N} $1"; }
ok()   { echo -e "${G}✓${N} $1"; }
warn() { echo -e "${Y}!${N} $1"; }
err()  { echo -e "${R}✗${N} $1"; }
hint() { echo -e "${D}  $1${N}"; }

[ -f "$ENV_FILE" ] || cp .env.example "$ENV_FILE"

# Helpers
abrir_url() {
  if command -v open >/dev/null; then open "$1" 2>/dev/null; fi
  echo -e "${D}  → $1${N}"
}

setar_env() {
  local key="$1" val="$2"
  if grep -q "^$key=" "$ENV_FILE"; then
    # macOS sed
    sed -i '' "s|^$key=.*|$key=\"$val\"|" "$ENV_FILE"
  else
    echo "$key=\"$val\"" >> "$ENV_FILE"
  fi
}

push_vercel() {
  local key="$1" val="$2"
  if [ "$PUSH_VERCEL" != "y" ]; then return 0; fi
  for env in $VERCEL_ENV_TARGET; do
    # Remove se já existe (vercel não aceita upsert)
    vercel env rm "$key" "$env" --yes >/dev/null 2>&1 || true
    echo "$val" | vercel env add "$key" "$env" >/dev/null 2>&1 && \
      hint "Vercel/$env: $key" || warn "Falha ao push $key pra Vercel/$env"
  done
}

prompt_secret() {
  local label="$1"
  local val=""
  echo -ne "  $label: "
  read -rs val
  echo ""
  printf "%s" "$val"
}

# Comandos especiais (não pedem prompt de Vercel)
case "$1" in
  status|limpar-clerk) ;;
  *)
    if [ -z "$SKIP_VERCEL" ] && [ -f .vercel/project.json ]; then
      echo ""
      read -rp "Sincronizar credenciais com Vercel ($(jq -r .projectName .vercel/project.json 2>/dev/null || echo projeto))? [y/N] " PUSH_VERCEL
      PUSH_VERCEL=$(echo "${PUSH_VERCEL:-n}" | tr '[:upper:]' '[:lower:]')
      echo ""
    fi
    ;;
esac

# ============================================================
# Supabase (auth)
# ============================================================
config_supabase() {
  log "Supabase Auth"
  hint "1. Acesse https://supabase.com/dashboard"
  hint "2. New project → escolha região São Paulo"
  hint "3. Project Settings → API → copie URL e anon (public) key"
  abrir_url "https://supabase.com/dashboard"
  echo ""
  read -rp "  Project URL (https://xxx.supabase.co): " SB_URL
  SB_ANON=$(prompt_secret "Anon (public) key")
  SB_SVC=$(prompt_secret "Service role key (opcional, server-only)")

  if [ -n "$SB_URL" ] && [ -n "$SB_ANON" ]; then
    log "Validando..."
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$SB_URL/auth/v1/health" -H "apikey: $SB_ANON" || echo "000")
    if [ "$HTTP" = "200" ]; then
      ok "Supabase respondeu 200"
    else
      err "Supabase retornou HTTP $HTTP (continuando mesmo assim)"
    fi
    setar_env NEXT_PUBLIC_SUPABASE_URL "$SB_URL"
    setar_env NEXT_PUBLIC_SUPABASE_ANON_KEY "$SB_ANON"
    setar_env EXPO_PUBLIC_SUPABASE_URL "$SB_URL"
    setar_env EXPO_PUBLIC_SUPABASE_ANON_KEY "$SB_ANON"
    [ -n "$SB_SVC" ] && setar_env SUPABASE_SERVICE_ROLE_KEY "$SB_SVC"
    push_vercel NEXT_PUBLIC_SUPABASE_URL "$SB_URL"
    push_vercel NEXT_PUBLIC_SUPABASE_ANON_KEY "$SB_ANON"
    [ -n "$SB_SVC" ] && push_vercel SUPABASE_SERVICE_ROLE_KEY "$SB_SVC"
    # Importante: tirar DEV_USER_EMAIL pra usar auth real
    setar_env DEV_USER_EMAIL ""
    ok "Supabase configurado. DEV_USER_EMAIL desativado — auth real ativada."
  else
    warn "Pulando Supabase (campos vazios)"
  fi
  echo ""
}

# ============================================================
# Anthropic Claude
# ============================================================
config_anthropic() {
  log "Anthropic Claude (IA)"
  hint "1. Acesse https://console.anthropic.com/settings/keys"
  hint "2. Create Key → cole abaixo"
  abrir_url "https://console.anthropic.com/settings/keys"
  echo ""
  KEY=$(prompt_secret "ANTHROPIC_API_KEY (sk-ant-...)")

  if [ -n "$KEY" ]; then
    log "Validando..."
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" \
      -X POST "https://api.anthropic.com/v1/messages" \
      -H "x-api-key: $KEY" \
      -H "anthropic-version: 2023-06-01" \
      -H "content-type: application/json" \
      -d '{"model":"claude-haiku-4-5-20251001","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}' || echo "000")
    if [ "$HTTP" = "200" ]; then
      ok "Anthropic respondeu 200"
    elif [ "$HTTP" = "401" ]; then
      err "Anthropic 401 — chave inválida. Continuando mesmo assim."
    else
      warn "Anthropic HTTP $HTTP (continuando)"
    fi
    setar_env ANTHROPIC_API_KEY "$KEY"
    push_vercel ANTHROPIC_API_KEY "$KEY"
    ok "Anthropic configurado."
  else
    warn "Pulando Anthropic (campo vazio)"
  fi
  echo ""
}

# ============================================================
# OpenAI (embeddings)
# ============================================================
config_openai() {
  log "OpenAI (embeddings)"
  hint "1. Acesse https://platform.openai.com/api-keys"
  hint "2. Create new secret key → cole abaixo"
  abrir_url "https://platform.openai.com/api-keys"
  echo ""
  KEY=$(prompt_secret "OPENAI_API_KEY (sk-...)")

  if [ -n "$KEY" ]; then
    log "Validando..."
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" \
      "https://api.openai.com/v1/models" -H "Authorization: Bearer $KEY" || echo "000")
    if [ "$HTTP" = "200" ]; then
      ok "OpenAI respondeu 200"
    elif [ "$HTTP" = "401" ]; then
      err "OpenAI 401 — chave inválida. Continuando."
    fi
    setar_env OPENAI_API_KEY "$KEY"
    push_vercel OPENAI_API_KEY "$KEY"
    ok "OpenAI configurado."
  else
    warn "Pulando OpenAI"
  fi
  echo ""
}

# ============================================================
# Stripe (billing)
# ============================================================
config_stripe() {
  log "Stripe (billing)"
  hint "1. Acesse https://dashboard.stripe.com/test/apikeys"
  hint "2. Reveal test key → copie SECRET key (sk_test_...)"
  hint "3. Em Products, crie 4 produtos: Pro Mensal, Pro Anual, Premium Mensal, Premium Anual"
  hint "4. Anote os Price IDs (price_...)"
  abrir_url "https://dashboard.stripe.com/test/apikeys"
  echo ""
  SK=$(prompt_secret "STRIPE_SECRET_KEY (sk_test_...)")

  if [ -n "$SK" ]; then
    log "Validando..."
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" \
      "https://api.stripe.com/v1/account" -u "$SK:" || echo "000")
    if [ "$HTTP" = "200" ]; then
      ok "Stripe respondeu 200"
    fi
    setar_env STRIPE_SECRET_KEY "$SK"
    push_vercel STRIPE_SECRET_KEY "$SK"

    read -rp "  PUBLISHABLE key (pk_test_...): " PK
    [ -n "$PK" ] && {
      setar_env NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "$PK"
      push_vercel NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "$PK"
    }

    WHS=$(prompt_secret "STRIPE_WEBHOOK_SECRET (whsec_...) — em Webhooks → Add endpoint → /api/webhooks/stripe")
    [ -n "$WHS" ] && {
      setar_env STRIPE_WEBHOOK_SECRET "$WHS"
      push_vercel STRIPE_WEBHOOK_SECRET "$WHS"
    }

    echo ""
    log "Price IDs (cole cada um, ou Enter pra pular):"
    for p in PRO_MONTHLY PRO_ANNUAL PREMIUM_MONTHLY PREMIUM_ANNUAL ORG_STARTER; do
      read -rp "  STRIPE_PRICE_$p: " V
      if [ -n "$V" ]; then
        setar_env "STRIPE_PRICE_$p" "$V"
        push_vercel "STRIPE_PRICE_$p" "$V"
      fi
    done
    ok "Stripe configurado."
  else
    warn "Pulando Stripe"
  fi
  echo ""
}

# ============================================================
# Resend (email)
# ============================================================
config_resend() {
  log "Resend (email transacional)"
  hint "1. Acesse https://resend.com/api-keys"
  hint "2. Create API key → cole abaixo"
  abrir_url "https://resend.com/api-keys"
  echo ""
  KEY=$(prompt_secret "RESEND_API_KEY (re_...)")

  if [ -n "$KEY" ]; then
    setar_env RESEND_API_KEY "$KEY"
    push_vercel RESEND_API_KEY "$KEY"
    read -rp "  EMAIL_FROM (ex: 'Residência Med <ola@seudominio.com>'): " FROM
    [ -n "$FROM" ] && {
      setar_env EMAIL_FROM "$FROM"
      push_vercel EMAIL_FROM "$FROM"
    }
    ok "Resend configurado."
  else
    warn "Pulando Resend"
  fi
  echo ""
}

# ============================================================
# Banco produção (Neon ou Supabase Postgres)
# ============================================================
config_database() {
  log "Postgres produção"
  hint "Opções: Neon (https://neon.tech) ou usar o próprio Supabase Postgres"
  hint "Cole a connection string com sslmode=require"
  abrir_url "https://neon.tech"
  echo ""
  URL=$(prompt_secret "DATABASE_URL (postgresql://user:pass@host/db?sslmode=require)")

  if [ -n "$URL" ]; then
    log "Validando conexão..."
    if command -v psql >/dev/null && timeout 5 psql "$URL" -c "SELECT 1" >/dev/null 2>&1; then
      ok "Conexão OK"
    else
      warn "psql não instalado ou conexão falhou — gravando mesmo assim"
    fi
    setar_env DATABASE_URL "$URL"
    setar_env DIRECT_URL "$URL"
    push_vercel DATABASE_URL "$URL"
    push_vercel DIRECT_URL "$URL"

    read -rp "  Aplicar migrations no banco de produção agora? [y/N] " AP
    if [ "$AP" = "y" ] || [ "$AP" = "Y" ]; then
      DATABASE_URL="$URL" pnpm --filter @residencia-med/db exec prisma migrate deploy
      read -rp "  Semear (bancas, temas, questões)? [y/N] " SE
      if [ "$SE" = "y" ] || [ "$SE" = "Y" ]; then
        DATABASE_URL="$URL" pnpm --filter @residencia-med/db db:seed
      fi
    fi
    ok "DB configurado."
  else
    warn "Pulando DB"
  fi
  echo ""
}

# ============================================================
# Redis produção (Upstash)
# ============================================================
config_redis() {
  log "Redis produção (Upstash)"
  hint "1. Acesse https://console.upstash.com"
  hint "2. Create Database → Region São Paulo → enable TLS"
  hint "3. Copie a UI rediss:// connection string"
  abrir_url "https://console.upstash.com"
  echo ""
  URL=$(prompt_secret "REDIS_URL (rediss://...)")

  if [ -n "$URL" ]; then
    setar_env REDIS_URL "$URL"
    push_vercel REDIS_URL "$URL"
    ok "Redis configurado."
  else
    warn "Pulando Redis"
  fi
  echo ""
}

# ============================================================
# VAPID (push web) — gera localmente
# ============================================================
config_vapid() {
  log "VAPID (push web)"
  if grep -q '^VAPID_PRIVATE_KEY="[A-Za-z0-9_-]\{20,\}"' "$ENV_FILE"; then
    ok "VAPID já configurado em .env"
    if [ "$PUSH_VERCEL" = "y" ]; then
      VPUB=$(grep '^VAPID_PUBLIC_KEY=' "$ENV_FILE" | cut -d'"' -f2)
      VPRV=$(grep '^VAPID_PRIVATE_KEY=' "$ENV_FILE" | cut -d'"' -f2)
      VSUB=$(grep '^VAPID_SUBJECT=' "$ENV_FILE" | cut -d'"' -f2)
      push_vercel VAPID_PUBLIC_KEY "$VPUB"
      push_vercel NEXT_PUBLIC_VAPID_PUBLIC_KEY "$VPUB"
      push_vercel VAPID_PRIVATE_KEY "$VPRV"
      push_vercel VAPID_SUBJECT "$VSUB"
    fi
    return 0
  fi
  log "Gerando VAPID keys..."
  KEYS=$(npx -y web-push generate-vapid-keys --json)
  PUB=$(echo "$KEYS" | python3 -c 'import json,sys; print(json.load(sys.stdin)["publicKey"])')
  PRV=$(echo "$KEYS" | python3 -c 'import json,sys; print(json.load(sys.stdin)["privateKey"])')
  setar_env VAPID_PUBLIC_KEY "$PUB"
  setar_env NEXT_PUBLIC_VAPID_PUBLIC_KEY "$PUB"
  setar_env VAPID_PRIVATE_KEY "$PRV"
  push_vercel VAPID_PUBLIC_KEY "$PUB"
  push_vercel NEXT_PUBLIC_VAPID_PUBLIC_KEY "$PUB"
  push_vercel VAPID_PRIVATE_KEY "$PRV"
  ok "VAPID gerado e gravado."
  echo ""
}

# ============================================================
# Admin email
# ============================================================
config_admin() {
  log "Email admin"
  hint "Quem vê /admin e /admin/exec. Pode ser uma lista separada por vírgula."
  read -rp "  ADMIN_EMAILS [$(grep '^ADMIN_EMAILS=' "$ENV_FILE" | cut -d'"' -f2)]: " EM
  if [ -n "$EM" ]; then
    setar_env ADMIN_EMAILS "$EM"
    push_vercel ADMIN_EMAILS "$EM"
    ok "Admin emails atualizados."
  fi
  echo ""
}

# ============================================================
# App URL
# ============================================================
config_app_url() {
  log "URL pública da aplicação"
  read -rp "  NEXT_PUBLIC_APP_URL [$(grep '^NEXT_PUBLIC_APP_URL=' "$ENV_FILE" | cut -d'"' -f2)]: " URL
  if [ -n "$URL" ]; then
    setar_env NEXT_PUBLIC_APP_URL "$URL"
    push_vercel NEXT_PUBLIC_APP_URL "$URL"
    ok "App URL configurada."
  fi
  echo ""
}

# ============================================================
# Menu
# ============================================================
ALL=(supabase anthropic openai stripe resend database redis vapid admin app_url)

# ============================================================
# Status — mostra quais credenciais estão OK / faltando
# ============================================================
mostrar_status() {
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  Status das credenciais"
  echo "═══════════════════════════════════════════════════════"
  echo ""
  echo "Local (.env):"

  check() {
    local key="$1" label="$2"
    local val
    val=$(grep "^$key=" "$ENV_FILE" 2>/dev/null | cut -d'"' -f2)
    if [ -z "$val" ]; then
      printf "  ${R}○${N} %-32s %s\n" "$label" "(vazio)"
    elif echo "$val" | grep -qE "placeholder|^sk-\\.\\.\\.|YOUR-PROJECT|^re_\\.\\.\\."; then
      printf "  ${Y}◐${N} %-32s %s\n" "$label" "placeholder"
    else
      local mask
      if [ ${#val} -gt 14 ]; then
        mask="${val:0:8}…${val: -4}"
      else
        mask="$val"
      fi
      printf "  ${G}●${N} %-32s %s\n" "$label" "$mask"
    fi
  }

  check NEXT_PUBLIC_SUPABASE_URL "Supabase URL"
  check NEXT_PUBLIC_SUPABASE_ANON_KEY "Supabase anon key"
  check SUPABASE_SERVICE_ROLE_KEY "Supabase service role"
  check ANTHROPIC_API_KEY "Anthropic Claude"
  check OPENAI_API_KEY "OpenAI"
  check STRIPE_SECRET_KEY "Stripe secret"
  check STRIPE_WEBHOOK_SECRET "Stripe webhook"
  check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "Stripe publishable"
  check RESEND_API_KEY "Resend"
  check DATABASE_URL "Database URL"
  check REDIS_URL "Redis URL"
  check VAPID_PRIVATE_KEY "VAPID private"
  check ADMIN_EMAILS "Admin emails"
  check NEXT_PUBLIC_APP_URL "App URL"
  check DEV_USER_EMAIL "DEV_USER_EMAIL (modo dev)"

  if [ -f .vercel/project.json ]; then
    echo ""
    echo "Vercel (production):"
    vercel env ls production 2>/dev/null | awk '
      /^ name/ {capture=1; next}
      /^Common next/ {capture=0}
      capture && NF>0 { printf "  ● %s\n", $1 }
    '
  fi
  echo ""
}

# ============================================================
# Limpeza de credenciais Clerk antigas
# ============================================================
limpar_clerk() {
  log "Removendo variáveis Clerk antigas (Vercel)"
  local clerk_vars=(NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY CLERK_SECRET_KEY CLERK_WEBHOOK_SECRET NEXT_PUBLIC_CLERK_SIGN_IN_URL NEXT_PUBLIC_CLERK_SIGN_UP_URL NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL)
  for v in "${clerk_vars[@]}"; do
    for env in production preview development; do
      vercel env rm "$v" "$env" --yes >/dev/null 2>&1 && hint "Removido: $v ($env)" || true
    done
  done
  ok "Variáveis Clerk removidas."
  echo ""
}

if [ "$1" = "status" ]; then
  mostrar_status
  exit 0
fi

if [ "$1" = "limpar-clerk" ]; then
  limpar_clerk
  exit 0
fi

if [ $# -eq 0 ]; then
  echo "═══════════════════════════════════════════════════════"
  echo "  Setup de credenciais — Residência Med"
  echo "═══════════════════════════════════════════════════════"
  echo ""
  echo "Vai configurar (na ordem):"
  for s in "${ALL[@]}"; do echo "  • $s"; done
  echo ""
  read -rp "Continuar? [Y/n] " GO
  GO=${GO:-y}
  [ "$GO" != "y" ] && [ "$GO" != "Y" ] && exit 0

  for s in "${ALL[@]}"; do
    "config_$s"
  done
else
  for s in "$@"; do
    if [[ " ${ALL[*]} " =~ " $s " ]]; then
      "config_$s"
    else
      err "Serviço desconhecido: $s"
      echo "Disponíveis: ${ALL[*]}"
      exit 1
    fi
  done
fi

echo ""
echo "═══════════════════════════════════════════════════════"
ok "Configuração concluída."
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Próximos passos:"
echo "  • Local:    ./scripts/dev-down.sh && ./scripts/dev-up.sh   (recarrega .env)"
[ "$PUSH_VERCEL" = "y" ] && echo "  • Deploy:   vercel --prod" || echo "  • Vercel:   vercel env add ... (ou rode novamente este script)"
