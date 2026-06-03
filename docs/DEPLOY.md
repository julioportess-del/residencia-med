# Deploy

Status: app no ar em modo demo em https://residencia-med.vercel.app.

A landing, /precos e /api/health respondem 200. Rotas autenticadas
(/dashboard, /questoes, /simulado etc) ficam protegidas até as credenciais
reais serem configuradas.

## Caminho rápido (15-20 min)

Depois de criar as contas (links abaixo), rode:

```bash
./scripts/setup-creds.sh
```

O wizard:

- Pergunta cada chave em sequência (1 por serviço)
- Valida cada uma com uma chamada de teste
- Grava no `.env` local
- (Opcional) sincroniza com Vercel via `vercel env add`

Após terminar:

```bash
vercel --prod        # redeploy com as novas env vars
```

## Serviços necessários

Total: ~15min de cliques + colar chaves. Quase tudo tem free tier.

### 1. Postgres produção — Neon (3 min)

- Acesse [neon.tech](https://neon.tech) → criar conta (free 0.5GB)
- New Project → região mais próxima
- Copie connection string (`postgresql://...?sslmode=require`)

O wizard pode aplicar migrations + seed automaticamente quando você colar a URL.

### 2. Supabase Auth (2 min)

- [supabase.com/dashboard](https://supabase.com/dashboard) → New project
- Project Settings → API → URL + anon public key
- (Opcional) Authentication → Providers → habilitar Google OAuth
- (Opcional) Authentication → Email Templates → personalizar

### 3. Anthropic Claude (2 min)

- [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- Create Key → cole no wizard
- Pré-pago, $5 mínimo. Cada explicação custa ~$0.001 com cache.

### 4. OpenAI embeddings (2 min, opcional)

- [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Necessário só pra busca semântica de guidelines (RAG)

### 5. Upstash Redis (2 min)

- [console.upstash.com](https://console.upstash.com) → Create Database
- Região mais próxima, TLS habilitado
- Copie a `rediss://` connection string (com TLS)

### 6. Stripe billing (5 min, opcional)

Pular se vai usar só o tier FREE.

- [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
- Copie Secret + Publishable
- Products → criar 4 produtos:
  - Pro Mensal — R$19/mês recorrente
  - Pro Anual — R$189/ano
  - Premium Mensal — R$39/mês
  - Premium Anual — R$389/ano
- Anotar Price IDs (`price_...`)
- Webhooks → Add endpoint:
  - URL: `https://SEU-DOMINIO/api/webhooks/stripe`
  - Eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
  - Copiar Signing Secret → `STRIPE_WEBHOOK_SECRET`

### 7. Resend email (1 min, opcional)

- [resend.com/api-keys](https://resend.com/api-keys) → Create API key
- Pra emails transacionais (boas-vindas, lembretes)
- Free tier: 100 emails/dia, 3000/mês

### 8. VAPID keys

Geradas automaticamente pelo wizard (não precisa de conta externa).

## Workers (BullMQ) em produção

A camada web funciona sozinha pra fluxos básicos, mas para **SM-2**, **plano
adaptativo** e **análise de incidência** funcionarem, é preciso rodar
`apps/workers` continuamente.

### Opção A — Railway (recomendado)

1. [railway.app](https://railway.app) → New Project → Empty Service
2. Connect GitHub repo
3. Settings:
   - Root directory: `apps/workers`
   - Build: `pnpm install --frozen-lockfile && pnpm --filter @residencia-med/db exec prisma generate`
   - Start: `pnpm --filter @residencia-med/workers start`
   - Variables: `DATABASE_URL`, `REDIS_URL`, `ANTHROPIC_API_KEY`

### Opção B — Fly.io ou Render

Qualquer container que rode Node continuamente funciona. Cole as mesmas
envs do Vercel.

## Mobile (Expo) → TestFlight + Play Store

```bash
cd apps/mobile
npx eas-cli login
eas build:configure
eas build --platform ios       # precisa Apple Developer $99/ano
eas build --platform android   # precisa Google Play $25 único
eas submit
```

Configure no `eas.json`:

- `EXPO_PUBLIC_API_URL=https://SEU-DOMINIO`
- `EXPO_PUBLIC_SUPABASE_URL=...`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY=...`

## Após terminar o wizard

```bash
# Local — reload das envs
./scripts/dev-down.sh && ./scripts/dev-up.sh

# Produção — redeploy
vercel --prod
```

A app sai automaticamente do modo demo quando detecta `NEXT_PUBLIC_SUPABASE_URL`
real (sem "placeholder") e `DEV_USER_EMAIL` vazio.

## CI/CD (GitHub Actions)

`.github/workflows/ci.yml` já está configurado. Pra ativar:

```bash
gh repo create residencia-med --private --source . --push
```

A Vercel detecta automaticamente (já está linkada via CLI). Cada PR vira
preview deployment.

## Custo estimado mensal

| Serviço      | Free             | Após escala                                  |
| ------------ | ---------------- | -------------------------------------------- |
| Vercel Hobby | 100GB BW         | até ~1k MAU                                  |
| Neon Free    | 0.5GB            | até ~100 users; Launch $19/mo a partir disso |
| Upstash      | 10k cmds/dia     | até ~1k users                                |
| Supabase     | 50k MAU          | suficiente pra fase early                    |
| Anthropic    | pay-per-use      | ~$0.50 por user PRO                          |
| Stripe       | 4.99% transações | proporcional                                 |
| Resend       | 100/dia free     | $20/mo a partir de 50k                       |

**Total inicial:** $0 até ~500 usuários. ~$50/mês até ~5k.

## Solução de problemas

**Push não funciona em mobile**: VAPID precisa ser HTTPS (Vercel é). Localhost
não funciona em iOS Safari.

**Webhooks Stripe falham**: o `STRIPE_WEBHOOK_SECRET` é diferente da Secret key.
Pegue em Developers → Webhooks → seu endpoint → Reveal signing secret.

**Auth Supabase loop**: confira que o Site URL e Redirect URLs em
Authentication → URL Configuration apontam pro domínio Vercel.

**Preview deployments quebram**: Vercel preview branches precisam das mesmas
envs que prod. O wizard adiciona em `production preview development` por
padrão.
