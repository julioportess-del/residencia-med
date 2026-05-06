# Deploy

Status atual: **app no ar em modo demo** em https://residencia-med.vercel.app.

A landing, a pagina /precos e o /api/health respondem 200. Rotas autenticadas
(/dashboard, /questoes, /simulado, etc) sao reescritas para /setup ate as
credenciais reais serem configuradas.

## Como ativar features completas

Total: ~15 minutos. Todos os servicos abaixo tem free tier sem cartao.

### 1. Postgres (Neon) — 3 min

1. Criar conta em https://neon.tech (free tier ate 0.5GB)
2. Create Project → escolha regiao mais proxima (us-east-1 sugerido)
3. Copiar a connection string (formato `postgresql://...neon.tech/dbname?sslmode=require`)
4. Atualizar no Vercel:
   - Vercel Dashboard → Project residencia-med → Settings → Environment Variables
   - Editar `DATABASE_URL` e `DIRECT_URL` com a string copiada

Aplicar schema (rodar uma vez):
```bash
DATABASE_URL="<sua-connection-string>" \
  pnpm --filter @residencia-med/db db:migrate:deploy

DATABASE_URL="<sua-connection-string>" \
  pnpm --filter @residencia-med/db db:seed
```

Isso cria 18 tabelas + popula 14 bancas, 7 especialidades + 36 temas, 5 guidelines, 30 questoes.

### 2. Clerk (auth) — 2 min

1. https://dashboard.clerk.com → Create Application
2. Nome: "Residencia Med"
3. Sign-in options: Email + Password
4. Em "API Keys" copie:
   - `Publishable key` → atualizar `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` no Vercel
   - `Secret key` → atualizar `CLERK_SECRET_KEY` no Vercel
5. Em "Webhooks" → Add Endpoint:
   - URL: `https://residencia-med.vercel.app/api/webhooks/clerk` (futuro, opcional)
   - Eventos: `user.created`

### 3. Anthropic Claude — 2 min

1. https://console.anthropic.com → settings → API Keys → Create
2. Copiar `sk-ant-...` → atualizar `ANTHROPIC_API_KEY` no Vercel
3. Pre-pago: $5 minimo. Cada explicacao IA custa ~$0.001 com cache.

### 4. Upstash Redis — 2 min

1. https://upstash.com → Create Database (free 10k req/dia)
2. Copiar a "Redis URL" → atualizar `REDIS_URL` no Vercel

### 5. Stripe (cobranca) — 5 min

So precisa se quiser monetizar. Pular se for usar so o tier FREE.

1. https://dashboard.stripe.com → Developers → API keys
2. Copiar `Secret key` → `STRIPE_SECRET_KEY`
3. Em Products → Create Product:
   - "Pro Mensal" — R$ 19/mes recorrente → copiar Price ID → `STRIPE_PRICE_PRO_MONTHLY`
   - "Pro Anual" — R$ 189/ano → `STRIPE_PRICE_PRO_ANNUAL`
   - "Premium Mensal" — R$ 39/mes → `STRIPE_PRICE_PREMIUM_MONTHLY`
   - "Premium Anual" — R$ 389/ano → `STRIPE_PRICE_PREMIUM_ANNUAL`
4. Em Developers → Webhooks → Add Endpoint:
   - URL: `https://residencia-med.vercel.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
   - Copiar Signing secret → `STRIPE_WEBHOOK_SECRET`

### 6. OpenAI (embeddings) — 2 min, opcional

So necessario se quiser busca semantica de guidelines. Pode pular.

1. https://platform.openai.com → API Keys → Create
2. `OPENAI_API_KEY=sk-...`

## Apos atualizar envs

Trigger redeploy:
- Vercel Dashboard → Deployments → ⋯ no ultimo → Redeploy
- OU `vercel deploy --prod` no terminal

A app entra automaticamente em modo completo apos o redeploy detectar credenciais reais
(o middleware checa se `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` nao tem "placeholder").

## Workers (BullMQ) — Railway

A camada web nao precisa de worker para funcionar minimamente. Mas para SM-2 e geracao
automatica de plano funcionarem, e preciso rodar `apps/workers`.

1. https://railway.app → New Project → Empty Service
2. Source: connect GitHub repo (apos pushar)
3. Settings:
   - Root directory: `apps/workers`
   - Build command: `pnpm install && pnpm --filter @residencia-med/db db:generate`
   - Start command: `pnpm --filter @residencia-med/workers start`
   - Variables: `DATABASE_URL`, `REDIS_URL`, `ANTHROPIC_API_KEY` (mesmas do Vercel)

Ou Fly.io / Render — qualquer container que rode Node continuamente.

## Mobile (Expo) — TestFlight + Play Store

1. `cd apps/mobile && npx eas-cli login`
2. `eas build:configure` (gera eas.json)
3. `eas build --platform ios` (precisa Apple Developer $99/ano)
4. `eas build --platform android` (precisa Google Play $25 unico)
5. `eas submit` para enviar

A API que o mobile consome ja esta no ar (https://residencia-med.vercel.app), basta
configurar `EXPO_PUBLIC_API_URL` apontando para ela e `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.

## CI/CD (GitHub Actions)

Esta tudo pronto em `.github/workflows/ci.yml` mas precisa de:

1. Repo no GitHub: `gh repo create residencia-med --private --source . --push`
2. Vercel detecta automaticamente (esta linkado por CLI)
3. Cada PR vira preview deployment

## Custo estimado mensal (free tier exhausto)

| Servico | Free | $19 PRO esperado |
|---|---|---|
| Vercel Hobby | 100GB bandwidth | ate 1k usuarios ativos |
| Neon Free | 0.5GB | ate 100 usuarios; subir pra Launch ($19/mo) em 500 |
| Upstash | 10k cmds/dia | ate 1k usuarios; Pay-as-go barato |
| Clerk | 10k MAU | suficiente para early stage |
| Anthropic | pay-per-use | ~$0.50/usuario PRO |
| Stripe | 4.99% transacoes | proporcional |

Total inicial: $0 ate ~500 usuarios. Depois ~$50/mes ate ~5k.
