# Escriba — Go-live (Vercel + Supabase)

Guia para colocar o Escriba no ar para uso clínico (Julio + Dra. Vanessa).
Stack: **Vercel** (hospedagem) · **Supabase Cloud** (Postgres + Auth) · login **e-mail/senha**.

Legenda: 👤 = só você pode fazer (conta/segredo) · 🤖 = o Claude pode fazer/dirigir.

---

## 0. Pré-requisitos (👤)

- Conta na **Vercel** (vercel.com) — pode logar com GitHub/e-mail.
- Conta no **Supabase** (supabase.com).
- As chaves de IA reais já em mãos (OpenAI + Anthropic). Já estão no `.env` da raiz.

> ⚠️ **Dado de saúde (LGPD art. 11).** Ao criar o projeto Supabase, escolha a região
> mais próxima/adequada (ex.: `South America (São Paulo)` se disponível) e trate as
> chaves `service_role` e de IA como segredos — nunca commitar.

---

## 1. Supabase — banco + auth (👤 cria, 🤖 migra)

1. **Criar projeto** em supabase.com → New project. Guarde a **Database password**.
2. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (secreto!)
3. Em **Project Settings → Database → Connection string**, copie duas URLs:
   - **Transaction pooler** (porta 6543, com `?pgbouncer=true`) → `DATABASE_URL_CLINICO`
   - **Direct connection** (porta 5432) → `DIRECT_URL_CLINICO`
4. **Rodar a migration do schema clínico** contra o banco novo (🤖 — me passe as duas URLs
   por um canal seguro OU rode você mesmo):
   ```bash
   DATABASE_URL_CLINICO="<pooler>" DIRECT_URL_CLINICO="<direct>" \
     pnpm --filter @residencia-med/db-clinico db:migrate:deploy
   ```
   Isso cria o schema `clinico` e todas as tabelas (Consulta, Transcricao, Evolucao,
   PreferenciasMedico, LogAcesso). **Não precisa de pgvector** — o schema clínico não usa.

> O schema clínico fica isolado em `clinico` no mesmo Postgres do Supabase. O Supabase
> Auth usa o schema `auth`. Sem conflito.

---

## 2. Vercel — deploy (👤 cria projeto, 🤖 configura/deploya)

Há `apps/escriba/vercel.json` já pronto com os comandos de build do monorepo.

1. **Importar/criar o projeto** na Vercel apontando para este repositório.
2. Em **Settings → General → Root Directory**, defina: `apps/escriba`.
   (O `vercel.json` cuida do install/build subindo para a raiz do monorepo e rodando o Turbo.)
3. Em **Settings → Environment Variables**, adicione TODAS as variáveis da tabela abaixo
   (escopo: Production + Preview).
4. **Deploy**. O build roda `pnpm turbo run build --filter=@residencia-med/escriba`
   (que gera o Prisma client de `db-clinico` automaticamente).

### Variáveis de ambiente na Vercel

| Variável                        | Valor                                         | Secreto |
| ------------------------------- | --------------------------------------------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project URL do Supabase                       | não     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key                                      | não     |
| `SUPABASE_SERVICE_ROLE_KEY`     | service_role key                              | **sim** |
| `DATABASE_URL_CLINICO`          | connection pooler (6543)                      | **sim** |
| `DIRECT_URL_CLINICO`            | direct connection (5432)                      | **sim** |
| `ANTHROPIC_API_KEY`             | chave Anthropic                               | **sim** |
| `OPENAI_API_KEY`                | chave OpenAI                                  | **sim** |
| `ANTHROPIC_MODEL`               | `claude-sonnet-4-6` (opcional)                | não     |
| `OPENAI_TRANSCRIBE_MODEL`       | `whisper-1` (opcional)                        | não     |
| `NEXT_PUBLIC_APP_URL`           | URL final (ex.: `https://escriba.vercel.app`) | não     |

> ❌ **NÃO** defina `DEV_USER_EMAIL` em produção. Em `NODE_ENV=production` o bypass de
> dev é ignorado por código, mas não configure mesmo assim. Login real é obrigatório.

---

## 3. Configurar o Auth do Supabase (👤)

1. **Authentication → URL Configuration**:
   - `Site URL`: a URL final da Vercel (ex.: `https://escriba.vercel.app`)
   - `Redirect URLs`: adicione `https://<sua-url>/auth/callback`
2. **Authentication → Providers → Email**: deixe **Email** habilitado.
   - Confirme se "Confirm email" está como você quer (para 2 usuárias conhecidas, pode
     deixar confirmação ligada e confirmar manualmente, ou desligar).
3. **Authentication → Sign in / Providers**: **desabilite "Allow new users to sign up"**
   (cadastro público fechado — app de saúde, só usuárias convidadas).
4. **Criar as contas** (Authentication → Users → Add user → Create new user), com senha:
   - Julio (seu e-mail)
   - Dra. Vanessa (e-mail dela)

   Cada médica só enxerga os próprios dados — todas as queries filtram por `usuarioAuthId`
   (multi-tenant já implementado).

---

## 4. Smoke test pós-deploy (🤖 dirijo, 👤 valida no navegador)

1. Abrir a URL → deve redirecionar para `/sign-in`.
2. Entrar com a conta criada → cai em `/consultas`.
3. **Nova consulta** → gravar um áudio curto de teste → **Gerar prontuário**.
4. Conferir: gerou SOAP / corrida / UBS; aba **Documentos** lista atestado/receita;
   **Assistente** responde; **Métricas** conta a consulta; **Preferências** salva.
5. Logout e login com a conta da Vanessa → confirmar que ela **não** vê suas consultas.

---

## Checklist rápido de go-live

- [ ] Projeto Supabase criado (região adequada) + credenciais copiadas
- [ ] Migration clínica aplicada (`db:migrate:deploy`)
- [ ] Projeto Vercel criado, Root Directory = `apps/escriba`
- [ ] Todas as env vars setadas na Vercel
- [ ] Deploy verde
- [ ] Auth: Site URL + Redirect URL + signup público desabilitado
- [ ] Contas de Julio e Vanessa criadas
- [ ] Smoke test ponta-a-ponta OK

---

## Notas

- **Áudio nunca é persistido** (LGPD): transita em memória no Route Handler e é descartado
  após a transcrição. Só o texto e a evolução ficam no banco.
- **Cache de IA (Redis) é opcional**: sem `REDIS_URL`, o sistema funciona normalmente
  (apenas sem cache — custo de IA levemente maior, irrelevante para 2 usuárias).
- **Revisão médica é obrigatória**: CID, condutas e documentos são sempre rascunhos a
  revisar antes de virar prontuário oficial.
- **`pnpm db:migrate:deploy`** aplica migrations existentes sem criar novas — seguro em prod.
  Nunca rode `migrate dev` contra o banco de produção.
